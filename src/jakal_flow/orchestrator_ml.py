from __future__ import annotations

from collections.abc import Callable
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import shutil
from pathlib import Path
from uuid import uuid4

from .commit_naming import build_commit_descriptor, build_initial_commit_descriptor
from .environment import ensure_gitignore, ensure_virtualenv
from . import execution_plan_support
from .codex_runner import CodexRunner
from .execution_control import ImmediateStopRequested
from .git_ops import GitOps
from .memory import MemoryStore
from .model_providers import normalize_billing_mode, provider_preset, provider_supports_auto_model
from .provider_fallbacks import (
    build_provider_fallback_runtimes,
    is_provider_fallbackable_error,
    is_quota_exhaustion_error,
)
from .model_selection import normalize_reasoning_effort
from .models import CandidateTask, Checkpoint, CodexRunResult, ExecutionPlanState, ExecutionStep, LineageState, LoopState, MLExperimentRecord, MLModeState, ProjectContext, ProjectPaths, RepoMetadata, RuntimeOptions, TestRunResult
from .optimization import scan_optimization_candidates
from .parallel_resources import build_parallel_resource_plan, normalize_parallel_worker_mode
from .platform_defaults import default_codex_path
from .planning import (
    FINALIZATION_PROMPT_FILENAME,
    attempt_history_entry,
    assess_repository_maturity,
    build_fast_planner_outline,
    build_mid_term_plan,
    build_mid_term_plan_from_plan_items,
    build_mid_term_plan_from_user_items,
    build_checkpoint_timeline,
    bootstrap_plan_prompt,
    candidate_tasks_from_mid_term,
    checkpoint_timeline_markdown,
    debugger_prompt,
    execution_plan_markdown,
    execution_plan_svg,
    execution_steps_to_plan_items,
    finalization_prompt,
    ensure_scope_guard,
    generate_project_plan,
    implementation_prompt,
    is_plan_markdown,
    load_debugger_prompt_template,
    load_merger_prompt_template,
    load_plan_decomposition_prompt_template,
    load_plan_generation_prompt_template,
    parse_execution_plan_response,
    prompt_to_plan_decomposition_prompt,
    parse_work_breakdown_response,
    prompt_to_execution_plan_prompt,
    optimization_prompt,
    reflection_markdown,
    scan_repository_inputs,
    select_candidate,
    load_step_execution_prompt_template,
    merger_prompt,
    validate_mid_term_subset,
    work_breakdown_prompt,
    write_active_task,
    load_source_prompt_template,
)
from .reporting import Reporter
from .status_views import status_from_plan_state
from .step_models import normalize_step_model, normalize_step_model_provider, provider_execution_preflight_error, resolve_step_model_choice
from .utils import compact_text, ensure_dir, normalize_workflow_mode, now_utc_iso, read_json, read_jsonl_tail, read_last_jsonl, read_text, remove_tree, svg_text_element, wrap_svg_text, write_json, write_text
from .verification import VerificationRunner
from .workspace import WorkspaceManager

UTC = getattr(datetime, "UTC", timezone.utc)


class OrchestratorMlMixin:
    def _default_ml_mode_state(self, context: ProjectContext) -> MLModeState:
        return MLModeState(
            workflow_mode=normalize_workflow_mode(context.runtime.workflow_mode),
            max_cycles=max(1, int(context.runtime.ml_max_cycles or 1)),
            updated_at=now_utc_iso(),
        )
    def load_ml_mode_state(self, context: ProjectContext) -> MLModeState:
        payload = read_json(context.paths.ml_mode_state_file, default=None)
        if not isinstance(payload, dict):
            return self._default_ml_mode_state(context)
        state = MLModeState.from_dict(payload)
        state.workflow_mode = normalize_workflow_mode(state.workflow_mode or context.runtime.workflow_mode)
        state.max_cycles = max(1, int(state.max_cycles or context.runtime.ml_max_cycles or 1))
        return state
    def _save_ml_mode_state(self, context: ProjectContext, state: MLModeState) -> MLModeState:
        normalized = MLModeState.from_dict(
            {
                **state.to_dict(),
                "workflow_mode": normalize_workflow_mode(state.workflow_mode or context.runtime.workflow_mode),
                "max_cycles": max(1, int(state.max_cycles or context.runtime.ml_max_cycles or 1)),
                "updated_at": now_utc_iso(),
            }
        )
        write_json(context.paths.ml_mode_state_file, normalized.to_dict())
        return normalized
    def _suggest_ml_cycle_index(self, context: ProjectContext, previous_plan_state: ExecutionPlanState | None = None) -> int:
        if normalize_workflow_mode(context.runtime.workflow_mode) != "ml":
            return 0
        state = self.load_ml_mode_state(context)
        if state.cycle_index <= 0:
            return 1
        if previous_plan_state and previous_plan_state.closeout_status == "completed":
            return state.cycle_index + 1
        return state.cycle_index
    def _initialize_ml_mode_state(
        self,
        context: ProjectContext,
        plan_state: ExecutionPlanState,
        objective: str,
        *,
        cycle_index: int,
    ) -> MLModeState:
        state = self.load_ml_mode_state(context)
        state.workflow_mode = normalize_workflow_mode(plan_state.workflow_mode or context.runtime.workflow_mode)
        state.max_cycles = max(1, int(context.runtime.ml_max_cycles or state.max_cycles or 1))
        if state.workflow_mode != "ml":
            return self._save_ml_mode_state(context, state)
        state.objective = objective.strip() or state.objective
        state.cycle_index = max(1, cycle_index or state.cycle_index or 1)
        state.stop_requested = False
        state.stop_reason = ""
        state.replan_required = False
        state.next_cycle_prompt = ""
        if not state.target_metric:
            for step in plan_state.steps:
                if isinstance(step.metadata, dict) and str(step.metadata.get("primary_metric", "")).strip():
                    state.target_metric = str(step.metadata.get("primary_metric", "")).strip()
                    break
        return self._save_ml_mode_state(context, state)
    def _load_ml_experiment_records(self, context: ProjectContext) -> list[MLExperimentRecord]:
        records: list[MLExperimentRecord] = []
        if not context.paths.ml_experiment_reports_dir.exists():
            return records
        for path in sorted(context.paths.ml_experiment_reports_dir.glob("*.json")):
            payload = read_json(path, default=None)
            if not isinstance(payload, dict):
                continue
            record = MLExperimentRecord.from_dict(payload)
            if not record.report_path:
                record.report_path = str(path)
            records.append(record)
        return records
    def _select_best_ml_experiment(self, state: MLModeState, records: list[MLExperimentRecord]) -> MLExperimentRecord | None:
        preferred_metric = state.target_metric.strip()
        matching = [
            record
            for record in records
            if record.metric_value is not None and (not preferred_metric or record.primary_metric == preferred_metric)
        ]
        candidates = matching if matching else [record for record in records if record.metric_value is not None]
        if not candidates:
            return None
        return max(
            candidates,
            key=lambda record: record.metric_value if record.metric_direction != "minimize" else -record.metric_value,
        )
    def _ml_results_svg(self, records: list[MLExperimentRecord]) -> str:
        font_family = "Segoe UI, Malgun Gothic, sans-serif"
        numeric = [record for record in records if record.metric_value is not None]
        if not numeric:
            return (
                '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="180" viewBox="0 0 960 180" role="img">'
                '<rect width="100%" height="100%" fill="#f8fafc" />'
                '<text x="40" y="80" fill="#0f172a" font-family="Segoe UI, Malgun Gothic, sans-serif" font-size="24" font-weight="700">ML experiment results</text>'
                '<text x="40" y="120" fill="#475569" font-family="Segoe UI, Malgun Gothic, sans-serif" font-size="16">No numeric experiment metrics recorded yet.</text>'
                "</svg>"
            )
        width = 960
        row_height = 58
        margin_x = 40
        margin_y = 52
        chart_width = 560
        height = margin_y + len(numeric) * row_height + 40
        values = [float(record.metric_value or 0.0) for record in numeric]
        min_value = min(values)
        max_value = max(values)
        span = max(max_value - min_value, 1e-9)
        parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img">',
            '<rect width="100%" height="100%" fill="#f8fafc" />',
            svg_text_element(margin_x, 30, ["ML experiment results"], fill="#0f172a", font_size=24, font_family=font_family, font_weight="700"),
        ]
        for index, record in enumerate(numeric):
            y = margin_y + index * row_height
            value = float(record.metric_value or 0.0)
            normalized = 0.15 + 0.85 * ((value - min_value) / span if span else 1.0)
            bar_width = chart_width * normalized
            label = f"{record.step_id or record.experiment_id}: {record.primary_metric or 'metric'}"
            parts.extend(
                [
                    svg_text_element(margin_x, y + 16, wrap_svg_text(compact_text(label, 110), 44, max_lines=2), fill="#0f172a", font_size=13, font_family=font_family, line_height=15),
                    f'<rect x="{margin_x}" y="{y + 34}" rx="8" ry="8" width="{chart_width}" height="12" fill="#e2e8f0" />',
                    f'<rect x="{margin_x}" y="{y + 34}" rx="8" ry="8" width="{bar_width:.1f}" height="12" fill="#2563eb" />',
                    svg_text_element(margin_x + chart_width + 20, y + 45, [f"{value:.6g}"], fill="#0f172a", font_size=12, font_family=font_family),
                ]
            )
        parts.append("</svg>")
        return "\n".join(parts)
    def _ml_experiment_markdown(self, state: MLModeState, records: list[MLExperimentRecord]) -> str:
        lines = [
            "# ML Experiment Report",
            "",
            f"- Updated at: {now_utc_iso()}",
            f"- Workflow mode: {state.workflow_mode}",
            f"- Cycle index: {state.cycle_index}",
            f"- Max cycles: {state.max_cycles}",
            f"- Objective: {state.objective or 'Not recorded.'}",
            f"- Target metric: {state.target_metric or 'Not recorded.'}",
            f"- Stop requested: {'yes' if state.stop_requested else 'no'}",
            f"- Stop reason: {state.stop_reason or 'continue'}",
            f"- Next cycle prompt: {compact_text(state.next_cycle_prompt, 400) or 'Not recorded.'}",
            "",
            "## Best Result",
            f"- Experiment: {state.best_experiment_id or 'Not recorded.'}",
            f"- Metric: {state.best_metric_name or 'Not recorded.'}",
            f"- Value: {state.best_metric_value if state.best_metric_value is not None else 'Not recorded.'}",
            "",
            "## Experiments",
            "",
            "| Step | Experiment | Kind | Metric | Value | Status | Resources | Notes |",
            "| --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
        if not records:
            lines.append("| - | - | - | - | - | - | - | No experiment reports recorded yet. |")
        for record in records:
            lines.append(
                "| {step} | {experiment} | {kind} | {metric} | {value} | {status} | {resources} | {notes} |".format(
                    step=record.step_id or "-",
                    experiment=record.experiment_id or "-",
                    kind=record.experiment_kind or "-",
                    metric=record.primary_metric or "-",
                    value=f"{record.metric_value:.6g}" if record.metric_value is not None else "-",
                    status=record.status or "-",
                    resources=compact_text(record.resource_budget or "-", 80).replace("|", "/"),
                    notes=compact_text(record.notes or record.validation_summary or "-", 120).replace("|", "/"),
                )
            )
        lines.extend(
            [
                "",
                "## Visualization",
                "- See docs/ML_EXPERIMENT_RESULTS.svg for the latest bar-chart summary.",
                "",
            ]
        )
        return "\n".join(lines)
    def refresh_ml_mode_outputs(self, context: ProjectContext) -> MLModeState:
        state = self.load_ml_mode_state(context)
        state.workflow_mode = normalize_workflow_mode(state.workflow_mode or context.runtime.workflow_mode)
        records = self._load_ml_experiment_records(context)
        state.experiments = records
        best = self._select_best_ml_experiment(state, records)
        if best is not None:
            state.best_experiment_id = best.experiment_id
            state.best_metric_name = best.primary_metric
            state.best_metric_value = best.metric_value
        elif not records:
            state.best_experiment_id = ""
            state.best_metric_name = ""
            state.best_metric_value = None
        if state.cycle_index <= 0:
            state.cycle_index = max([record.cycle_index for record in records], default=0)
        write_text(context.paths.ml_experiment_report_file, self._ml_experiment_markdown(state, records))
        write_text(context.paths.ml_experiment_results_svg_file, self._ml_results_svg(records))
        return self._save_ml_mode_state(context, state)
    def _collect_ml_step_report(
        self,
        context: ProjectContext,
        step: ExecutionStep,
        *,
        source_paths: ProjectPaths | None = None,
        report_payload: dict[str, object] | None = None,
    ) -> MLExperimentRecord | None:
        if normalize_workflow_mode(context.runtime.workflow_mode) != "ml":
            return None
        payload = report_payload if isinstance(report_payload, dict) else read_json((source_paths or context.paths).ml_step_report_file, default={})
        if not isinstance(payload, dict):
            payload = {}
        state = self.load_ml_mode_state(context)
        metadata = step.metadata if isinstance(step.metadata, dict) else {}
        destination = context.paths.ml_experiment_reports_dir / f"{step.step_id}.json"
        merged = {
            "experiment_id": payload.get("experiment_id") or metadata.get("experiment_id") or step.step_id,
            "cycle_index": payload.get("cycle_index") or max(1, state.cycle_index or 1),
            "step_id": step.step_id,
            "status": payload.get("status") or step.status or "completed",
            "title": payload.get("title") or step.title,
            "experiment_kind": payload.get("experiment_kind") or metadata.get("experiment_kind", ""),
            "dataset_policy": payload.get("dataset_policy") or metadata.get("dataset_policy", ""),
            "leakage_guard": payload.get("leakage_guard") or metadata.get("leakage_guard", ""),
            "feature_spec": payload.get("feature_spec") or metadata.get("feature_spec", ""),
            "model_spec": payload.get("model_spec") or metadata.get("model_spec", ""),
            "architecture_spec": payload.get("architecture_spec") or metadata.get("architecture_spec", ""),
            "parameter_budget": payload.get("parameter_budget") or metadata.get("parameter_budget", ""),
            "resource_budget": payload.get("resource_budget") or metadata.get("resource_budget", ""),
            "train_command": payload.get("train_command") or metadata.get("train_command", ""),
            "eval_command": payload.get("eval_command") or metadata.get("eval_command", ""),
            "primary_metric": payload.get("primary_metric") or metadata.get("primary_metric", ""),
            "metric_direction": payload.get("metric_direction") or metadata.get("metric_direction", "maximize"),
            "metric_value": payload.get("metric_value"),
            "validation_summary": payload.get("validation_summary") or step.notes,
            "artifact_paths": payload.get("artifact_paths") or metadata.get("artifact_paths", []),
            "notes": payload.get("notes") or step.notes,
            "report_path": str(destination),
            "updated_at": now_utc_iso(),
        }
        record = MLExperimentRecord.from_dict(merged)
        write_json(destination, record.to_dict())
        if source_paths is None or source_paths == context.paths:
            try:
                context.paths.ml_step_report_file.unlink(missing_ok=True)
            except OSError:
                pass
        self.refresh_ml_mode_outputs(context)
        return record
    def should_continue_ml_cycles(self, context: ProjectContext) -> tuple[bool, str]:
        if normalize_workflow_mode(context.runtime.workflow_mode) != "ml":
            return False, "workflow_mode_not_ml"
        state = self.refresh_ml_mode_outputs(context)
        if state.stop_requested:
            return False, state.stop_reason or "ml_stop_requested"
        if state.cycle_index >= max(1, int(context.runtime.ml_max_cycles or 1)):
            state.stop_requested = True
            state.stop_reason = "ml_max_cycles_reached"
            self._save_ml_mode_state(context, state)
            return False, state.stop_reason
        if not state.next_cycle_prompt.strip():
            return False, "next_cycle_prompt_missing"
        return True, ""
    def prepare_next_ml_cycle(
        self,
        project_dir: Path,
        runtime: RuntimeOptions,
        branch: str = "main",
        origin_url: str = "",
    ) -> tuple[ProjectContext, ExecutionPlanState, bool, str]:
        context = self.setup_local_project(project_dir=project_dir, runtime=runtime, branch=branch, origin_url=origin_url)
        current_plan = self.load_execution_plan_state(context)
        should_continue, reason = self.should_continue_ml_cycles(context)
        if not should_continue:
            return context, current_plan, False, reason
        state = self.load_ml_mode_state(context)
        project_prompt = state.next_cycle_prompt.strip()
        if not project_prompt:
            return context, current_plan, False, "next_cycle_prompt_missing"
        context, plan_state = self.generate_execution_plan(
            project_dir=project_dir,
            runtime=runtime,
            project_prompt=project_prompt,
            branch=branch,
            max_steps=max(1, runtime.max_blocks),
            origin_url=origin_url,
        )
        state = self.load_ml_mode_state(context)
        state.replan_required = False
        state.next_cycle_prompt = ""
        state.stop_requested = False
        state.stop_reason = ""
        self._save_ml_mode_state(context, state)
        return context, plan_state, True, ""
