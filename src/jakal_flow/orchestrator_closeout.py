from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from .commit_naming import build_commit_descriptor
from .errors import (
    AgentPassExecutionError,
    ExecutionFailure,
    HANDLED_OPERATION_EXCEPTIONS,
    VerificationTestFailure,
    failure_log_fields,
)
from .execution_control import ImmediateStopRequested
from .models import CodexRunResult, ExecutionPlanState, ProjectContext, RuntimeOptions, TestRunResult
from .optimization import scan_optimization_candidates
from .planning import (
    attempt_history_entry,
    finalization_prompt,
    optimization_prompt,
    reflection_markdown,
    scan_repository_inputs,
)
from .reporting import Reporter
from .utils import normalize_workflow_mode, now_utc_iso, read_json, read_last_jsonl, write_json

UTC = getattr(datetime, "UTC", timezone.utc)


class OrchestratorCloseoutMixin:
    def _stale_closeout_note(self, context: ProjectContext, plan_state: ExecutionPlanState) -> str:
        note_parts = [
            "Closeout appears to have stopped before it finished; the saved running state was recovered as failed."
        ]
        started_at = str(plan_state.closeout_started_at or "").strip()
        if started_at:
            note_parts.append(f"Started at {started_at}.")
        latest_failure_status = read_json(context.paths.reports_dir / "latest_pr_failure_status.json", default={})
        if isinstance(latest_failure_status, dict):
            report_path = str(latest_failure_status.get("report_markdown_file", "")).strip()
            if report_path:
                note_parts.append(f"Latest failure report: {report_path}")
        existing_notes = str(plan_state.closeout_notes or "").strip()
        if existing_notes and existing_notes not in note_parts:
            note_parts.append(existing_notes)
        return " ".join(note_parts).strip()

    def _recover_stale_closeout_state(self, context: ProjectContext, plan_state: ExecutionPlanState) -> bool:
        if not self._closeout_run_is_stale(context, plan_state):
            return False
        plan_state.closeout_status = "failed"
        plan_state.closeout_completed_at = None
        plan_state.closeout_commit_hash = None
        plan_state.closeout_notes = self._stale_closeout_note(context, plan_state)
        plan_state.last_updated_at = now_utc_iso()
        write_json(context.paths.execution_plan_file, plan_state.to_dict())
        context.metadata.current_status = self._status_from_plan_state(plan_state)
        context.metadata.last_run_at = plan_state.last_updated_at
        self.workspace.save_project(context)
        return True

    def _next_logged_block_index(self, context: ProjectContext) -> int:
        latest_logged_block = read_last_jsonl(context.paths.block_log_file)
        latest_logged_block_index = int(latest_logged_block.get("block_index", 0)) if latest_logged_block else 0
        return max(1, context.loop_state.block_index + 1, latest_logged_block_index + 1)

    def _codex_failure_note(self, task_name: str, run_result: CodexRunResult) -> str:
        detail = self._run_result_failure_detail(run_result)
        summary = f"{task_name} Codex pass failed and changes were rolled back."
        if detail:
            return f"{summary} Cause: {detail}"
        return summary

    def _rolled_back_test_failure_note(self, test_result: TestRunResult, *, fallback_task_name: str) -> str:
        detail = str(test_result.summary or "").strip()
        if detail:
            return f"{detail} (changes were rolled back)"
        return f"{fallback_task_name} verification failed and changes were rolled back."

    def _execute_verified_repo_pass(
        self,
        *,
        context: ProjectContext,
        runner: object,
        reporter: Reporter,
        prompt: str,
        pass_type: str,
        block_index: int,
        task_name: str,
        safe_revision: str,
    ) -> dict[str, object]:
        run_result = self._run_pass_with_provider_fallback(
            context=context,
            runner=runner,
            prompt=prompt,
            pass_type=pass_type,
            block_index=block_index,
            search_enabled=False,
            safe_revision=safe_revision,
            execution_step=None,
            provider_selection_source="auto",
        )
        run_result.changed_files = self.git.changed_files(context.paths.repo_dir)

        commit_hash: str | None = None
        rollback_status = "not_needed"
        test_result: TestRunResult | None = None
        changed_files = sorted(set(run_result.changed_files))
        success = False
        notes = ""
        failure: ExecutionFailure | None = None

        if run_result.returncode != 0:
            self.git.hard_reset(context.paths.repo_dir, safe_revision)
            rollback_status = "rolled_back_to_safe_revision"
            failure = AgentPassExecutionError(self._codex_failure_note(task_name, run_result))
            notes = str(failure)
        else:
            try:
                test_result = self._run_test_command(context, block_index, pass_type)
            except ImmediateStopRequested:
                self.git.hard_reset(context.paths.repo_dir, safe_revision)
                raise
            reporter.save_test_result(block_index, pass_type, test_result)
            if test_result.returncode != 0:
                self.git.hard_reset(context.paths.repo_dir, safe_revision)
                rollback_status = "rolled_back_to_safe_revision"
                failure = VerificationTestFailure(
                    self._rolled_back_test_failure_note(test_result, fallback_task_name=task_name)
                )
                notes = str(failure)
            else:
                if self.git.has_changes(context.paths.repo_dir):
                    commit_descriptor = build_commit_descriptor(context, pass_type, task_name)
                    commit_hash = self.git.commit_all(
                        context.paths.repo_dir,
                        commit_descriptor.message,
                        author_name=commit_descriptor.author_name,
                    )
                if commit_hash:
                    context.metadata.current_safe_revision = commit_hash
                    context.loop_state.current_safe_revision = commit_hash
                    pushed, push_reason = self._push_if_ready(
                        context,
                        context.paths.repo_dir,
                        context.metadata.branch,
                        commit_hash=commit_hash,
                    )
                    if not pushed and push_reason not in {"already_up_to_date"}:
                        notes = (notes + f" Push skipped: {push_reason}.").strip()
                success = True
                notes = test_result.summary

        return {
            "success": success,
            "notes": notes,
            "run_result": run_result,
            "test_result": test_result,
            "commit_hash": commit_hash,
            "changed_files": changed_files,
            "rollback_status": rollback_status,
            "safe_revision": commit_hash or safe_revision,
            **failure_log_fields(failure),
        }

    def _record_repo_pass(
        self,
        *,
        context: ProjectContext,
        reporter: Reporter,
        block_index: int,
        pass_type: str,
        selected_task: str,
        pass_result: dict[str, object],
        success_block_status: str,
        failure_block_status: str,
        extra_pass_fields: dict[str, object] | None = None,
        extra_block_fields: dict[str, object] | None = None,
    ) -> None:
        run_result = pass_result.get("run_result")
        test_result = pass_result.get("test_result")
        commit_hash = pass_result.get("commit_hash")
        rollback_status = str(pass_result.get("rollback_status") or "not_needed")
        changed_files = list(pass_result.get("changed_files") or [])
        success = bool(pass_result.get("success"))
        failure_type = str(pass_result.get("failure_type") or "").strip()
        failure_reason_code = str(pass_result.get("failure_reason_code") or "").strip()
        reporter.log_pass(
            {
                "repository_id": context.metadata.repo_id,
                "repository_slug": context.metadata.slug,
                "block_index": block_index,
                "pass_type": pass_type,
                "selected_task": selected_task,
                "changed_files": changed_files,
                "test_results": test_result.to_dict() if isinstance(test_result, TestRunResult) else None,
                "usage": run_result.usage if run_result else {},
                "duration_seconds": run_result.duration_seconds if run_result else 0.0,
                "codex_attempt_count": run_result.attempt_count if run_result else 0,
                "codex_diagnostics": run_result.diagnostics if run_result else {},
                "codex_return_code": run_result.returncode if run_result else None,
                "commit_hash": commit_hash,
                "rollback_status": rollback_status,
                "search_enabled": False,
                **(
                    {
                        "failure_type": failure_type,
                        "failure_reason_code": failure_reason_code,
                    }
                    if failure_type
                    else {}
                ),
                **(extra_pass_fields or {}),
            }
        )
        reporter.log_block(
            {
                "repository_id": context.metadata.repo_id,
                "repository_slug": context.metadata.slug,
                "block_index": block_index,
                "status": success_block_status if success else failure_block_status,
                "selected_task": selected_task,
                "changed_files": changed_files,
                "test_summary": str(pass_result.get("notes") or "").strip(),
                "commit_hashes": [str(commit_hash)] if commit_hash else [],
                "rollback_status": rollback_status,
                **(
                    {
                        "failure_type": failure_type,
                        "failure_reason_code": failure_reason_code,
                    }
                    if failure_type
                    else {}
                ),
                **(extra_block_fields or {}),
            }
        )
        reporter.write_block_review(
            reflection_markdown(
                selected_task,
                str(pass_result.get("notes") or "").strip() or "No summary recorded.",
                changed_files,
                [str(commit_hash)] if commit_hash else [],
            )
        )
        reporter.append_attempt_history(
            attempt_history_entry(
                block_index,
                selected_task,
                success_block_status.replace("_", " ") if success else failure_block_status.replace("_", " "),
                [str(commit_hash)] if commit_hash else [],
            )
        )

    def _run_optional_closeout_optimization(
        self,
        *,
        context: ProjectContext,
        plan_state: ExecutionPlanState,
        runner: object,
        reporter: Reporter,
        safe_revision: str,
        block_index: int,
    ) -> tuple[str, int]:
        scan_result = scan_optimization_candidates(context.paths.repo_dir, context.runtime)
        if not scan_result.candidates:
            return safe_revision, block_index

        optimization_task = f"Pre-closeout optimization ({scan_result.mode})"
        context.loop_state.current_task = optimization_task
        self.workspace.save_project(context)
        pass_result: dict[str, object] = {
            "success": False,
            "notes": "",
            "run_result": None,
            "test_result": None,
            "commit_hash": None,
            "changed_files": [],
            "rollback_status": "not_needed",
            "safe_revision": safe_revision,
        }
        try:
            pass_result = self._execute_verified_repo_pass(
                context=context,
                runner=runner,
                reporter=reporter,
                prompt=optimization_prompt(context, plan_state, scan_result),
                pass_type="project-optimization-pass",
                block_index=block_index,
                task_name=optimization_task,
                safe_revision=safe_revision,
            )
        except HANDLED_OPERATION_EXCEPTIONS as exc:
            self.git.hard_reset(context.paths.repo_dir, safe_revision)
            pass_result = {
                "success": False,
                "notes": str(exc).strip() or "Pre-closeout optimization failed.",
                "run_result": pass_result.get("run_result"),
                "test_result": None,
                "commit_hash": None,
                "changed_files": self.git.changed_files(context.paths.repo_dir),
                "rollback_status": "rolled_back_to_safe_revision",
                "safe_revision": safe_revision,
            }

        self._record_repo_pass(
            context=context,
            reporter=reporter,
            block_index=block_index,
            pass_type="project-optimization-pass",
            selected_task=optimization_task,
            pass_result=pass_result,
            success_block_status="optimization_completed",
            failure_block_status="optimization_failed",
            extra_pass_fields={
                "optimization_mode": scan_result.mode,
                "optimization_candidates": [item.to_dict() for item in scan_result.candidates],
                "scanned_file_count": scan_result.scanned_file_count,
            },
            extra_block_fields={
                "optimization_mode": scan_result.mode,
                "candidate_files": list(scan_result.candidate_files),
            },
        )
        return str(pass_result.get("safe_revision") or safe_revision), block_index + 1

    def _parse_iso_timestamp(self, value: str | None) -> datetime | None:
        raw = str(value or "").strip()
        if not raw:
            return None
        try:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            return None
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)

    def _closeout_run_is_stale(self, context: ProjectContext, plan_state: ExecutionPlanState) -> bool:
        if plan_state.closeout_status != "running":
            return False
        if context.metadata.current_status != "running:closeout":
            return True
        heartbeat = max(
            (
                item
                for item in (
                    self._parse_iso_timestamp(context.metadata.last_run_at),
                    self._parse_iso_timestamp(plan_state.closeout_started_at),
                )
                if item is not None
            ),
            default=None,
        )
        if heartbeat is None:
            return True
        return datetime.now(tz=UTC) - heartbeat > self._STALE_CLOSEOUT_TIMEOUT

    def _closeout_pull_request_title(self, plan_state: ExecutionPlanState) -> str:
        return plan_state.plan_title.strip() or "jakal-flow closeout"

    def _closeout_pull_request_body(self, context: ProjectContext, plan_state: ExecutionPlanState) -> str:
        return (
            "Automatically opened by jakal-flow after a successful closeout push.\n\n"
            f"- Branch: `{context.metadata.branch}`\n"
            f"- Closeout commit: `{plan_state.closeout_commit_hash or 'unknown'}`\n"
        )

    def _closeout_branch_name(self, plan_state: ExecutionPlanState) -> str:
        started_at = self._parse_iso_timestamp(plan_state.closeout_started_at) or datetime.now(tz=UTC)
        timestamp = started_at.astimezone(UTC).strftime("%Y%m%d%H%M%S")
        commit_fragment = "".join(ch for ch in str(plan_state.closeout_commit_hash or "").lower() if ch.isalnum())[:8]
        if not commit_fragment:
            commit_fragment = "closeout"
        return f"jakal-flow-closeout-{timestamp}-{commit_fragment}"

    def _publish_closeout_pull_request(
        self,
        context: ProjectContext,
        plan_state: ExecutionPlanState,
    ) -> dict[str, object]:
        base_branch = str(context.metadata.branch or "").strip() or "main"
        title = self._closeout_pull_request_title(plan_state)
        body = self._closeout_pull_request_body(context, plan_state)
        result = self._maybe_open_pull_request(
            context,
            head_branch=base_branch,
            title=title,
            body=body,
            auto_merge=context.runtime.auto_merge_pull_request,
            merge_method="merge",
        )
        if str(result.get("reason") or "") != "head_matches_base":
            return {
                **result,
                "head_branch": base_branch,
                "base_branch": base_branch,
                "closeout_branch_pushed": False,
            }

        closeout_branch = self._closeout_branch_name(plan_state)
        self.git.push_refspec(context.paths.repo_dir, "HEAD", closeout_branch)
        retry = self._maybe_open_pull_request(
            context,
            head_branch=closeout_branch,
            base_branch=base_branch,
            title=title,
            body=body,
            auto_merge=context.runtime.auto_merge_pull_request,
            merge_method="merge",
        )
        return {
            **retry,
            "head_branch": closeout_branch,
            "base_branch": base_branch,
            "closeout_branch_pushed": True,
        }

    def run_execution_closeout(
        self,
        project_dir: Path,
        runtime: RuntimeOptions,
        branch: str = "main",
        origin_url: str = "",
    ) -> tuple[ProjectContext, ExecutionPlanState]:
        context = self.setup_local_project(project_dir=project_dir, runtime=runtime, branch=branch, origin_url=origin_url)
        plan_state = self.load_execution_plan_state(context)
        if not plan_state.steps:
            raise RuntimeError("No saved execution plan exists for this project.")
        if not self._all_steps_completed(plan_state.steps):
            raise RuntimeError("Closeout can run only after all execution tasks are completed.")
        if plan_state.closeout_status == "running":
            if not self._closeout_run_is_stale(context, plan_state):
                raise RuntimeError("Closeout is already running.")
            plan_state.closeout_status = "failed"
            plan_state.closeout_notes = "Recovered a stale closeout state before retrying."
            context.metadata.current_status = self._status_from_plan_state(plan_state)
            self.save_execution_plan_state(context, plan_state)
            self.workspace.save_project(context)

        previous_runtime = context.runtime
        context.runtime = RuntimeOptions(
            **{
                **previous_runtime.to_dict(),
                "test_cmd": plan_state.default_test_command or runtime.test_cmd,
                "allow_push": True,
                "approval_mode": runtime.approval_mode,
                "sandbox_mode": runtime.sandbox_mode,
                "require_checkpoint_approval": False,
                "checkpoint_interval_blocks": 1,
            }
        )
        closeout_started_at = now_utc_iso()
        plan_state.closeout_status = "running"
        plan_state.closeout_started_at = closeout_started_at
        plan_state.closeout_completed_at = None
        plan_state.closeout_commit_hash = None
        plan_state.closeout_notes = ""
        context.metadata.current_status = "running:closeout"
        context.metadata.last_run_at = closeout_started_at
        context.loop_state.current_task = "Project closeout"
        self.save_execution_plan_state(context, plan_state)
        self.workspace.save_project(context)

        runner = self._create_codex_runner(context.runtime.codex_path)
        reporter = Reporter(context)
        repo_inputs = scan_repository_inputs(context.paths.repo_dir)
        safe_revision = context.metadata.current_safe_revision or self.git.current_revision(context.paths.repo_dir)
        next_block_index = self._next_logged_block_index(context)
        safe_revision, next_block_index = self._run_optional_closeout_optimization(
            context=context,
            plan_state=plan_state,
            runner=runner,
            reporter=reporter,
            safe_revision=safe_revision,
            block_index=next_block_index,
        )
        prompt = finalization_prompt(
            context=context,
            plan_state=plan_state,
            repo_inputs=repo_inputs,
        )
        closeout_block_index = next_block_index
        closeout_task = "Project closeout"
        context.loop_state.current_task = closeout_task
        self.workspace.save_project(context)
        closeout_result: dict[str, object] = {
            "success": False,
            "notes": "",
            "run_result": None,
            "test_result": None,
            "commit_hash": None,
            "changed_files": [],
            "rollback_status": "not_needed",
            "safe_revision": safe_revision,
        }
        closeout_interrupted = False

        try:
            closeout_result = self._execute_verified_repo_pass(
                context=context,
                runner=runner,
                reporter=reporter,
                prompt=prompt,
                pass_type="project-closeout-pass",
                block_index=closeout_block_index,
                task_name=closeout_task,
                safe_revision=safe_revision,
            )
            if bool(closeout_result.get("success")):
                plan_state.closeout_status = "completed"
                plan_state.closeout_completed_at = now_utc_iso()
                plan_state.closeout_commit_hash = str(closeout_result.get("commit_hash") or "") or None
                plan_state.closeout_notes = str(closeout_result.get("notes") or "").strip()
            else:
                plan_state.closeout_status = "failed"
                plan_state.closeout_notes = str(closeout_result.get("notes") or "").strip()
        except ImmediateStopRequested as exc:
            self.git.hard_reset(context.paths.repo_dir, safe_revision)
            closeout_interrupted = True
            plan_state.closeout_status = "not_started"
            plan_state.closeout_started_at = None
            plan_state.closeout_completed_at = None
            plan_state.closeout_commit_hash = None
            plan_state.closeout_notes = str(exc).strip() or "Immediate stop requested."
        except HANDLED_OPERATION_EXCEPTIONS as exc:
            plan_state.closeout_status = "failed"
            plan_state.closeout_notes = str(exc).strip() or "Closeout failed."
            raise
        finally:
            closeout_result["notes"] = plan_state.closeout_notes
            if not closeout_interrupted:
                self._record_repo_pass(
                    context=context,
                    reporter=reporter,
                    block_index=closeout_block_index,
                    pass_type="project-closeout-pass",
                    selected_task=closeout_task,
                    pass_result=closeout_result,
                    success_block_status="closeout_completed",
                    failure_block_status="closeout_failed",
                )
            context.runtime = previous_runtime
            if normalize_workflow_mode(context.runtime.workflow_mode) == "ml":
                self.refresh_ml_mode_outputs(context)
            context.metadata.current_status = self._status_from_plan_state(plan_state)
            context.metadata.last_run_at = now_utc_iso()
            self.save_execution_plan_state(context, plan_state)
            self.workspace.save_project(context)
            reporter.write_status_report()
            if context.runtime.generate_word_report:
                reporter.write_closeout_word_report()
            if plan_state.closeout_status != "completed" and not closeout_interrupted:
                self._report_failure(
                    context,
                    reporter,
                    failure_type="closeout_failed",
                    summary=plan_state.closeout_notes or "Closeout failed.",
                    block_index=closeout_block_index,
                    selected_task=closeout_task,
                )
            elif plan_state.closeout_status == "completed":
                self._publish_closeout_pull_request(context, plan_state)

        return context, plan_state

    def _maybe_open_pull_request(
        self,
        context: ProjectContext,
        *,
        head_branch: str,
        base_branch: str = "",
        title: str,
        body: str = "",
        draft: bool = False,
        auto_merge: bool = False,
        merge_method: str = "squash",
        status_filename: str = "latest_pull_request_status.json",
    ) -> dict[str, object]:
        reporter = Reporter(context)
        result = reporter.ensure_pull_request(
            head_branch=head_branch,
            base_branch=base_branch,
            title=title,
            body=body,
            draft=draft,
            auto_merge=auto_merge,
            merge_method=merge_method,
        )
        write_json(
            context.paths.reports_dir / status_filename,
            {
                "generated_at": now_utc_iso(),
                "head_branch": head_branch,
                "base_branch": base_branch,
                "title": title,
                "auto_merge": auto_merge,
                "merge_method": merge_method,
                "result": result,
            },
        )
        return result
