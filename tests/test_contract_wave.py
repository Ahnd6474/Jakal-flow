from __future__ import annotations

import shutil
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow.contract_wave import (
    DEFAULT_SPINE_VERSION,
    build_lineage_manifest,
    classify_completed_lineage_step,
    current_spine_version,
    load_common_requirements_state,
    load_lineage_manifests,
    load_spine_state,
    normalize_execution_step_policy,
    save_lineage_manifest,
    update_contract_wave_artifacts_for_completion,
)
from jakal_flow.models import ExecutionPlanState, ExecutionStep, LineageState, RuntimeOptions
from jakal_flow.orchestrator import Orchestrator
from jakal_flow.workspace import WorkspaceManager


class ContractWaveTests(unittest.TestCase):
    def test_execution_step_from_dict_hydrates_policy_fields_from_metadata(self) -> None:
        step = ExecutionStep.from_dict(
            {
                "step_id": "ST1",
                "title": "Shared contract pass",
                "metadata": {
                    "step_type": "contract",
                    "scope_class": "shared_reviewed",
                    "spine_version": "spine-v4",
                    "shared_contracts": ["api.user", "schema.profile"],
                    "verification_profile": "contracts",
                    "promotion_class": "yellow",
                    "primary_scope_paths": ["src/contracts"],
                    "shared_reviewed_paths": ["src/shared"],
                    "forbidden_core_paths": ["src/core"],
                },
            }
        )

        self.assertEqual(step.step_type, "contract")
        self.assertEqual(step.scope_class, "shared_reviewed")
        self.assertEqual(step.spine_version, "spine-v4")
        self.assertEqual(step.shared_contracts, ["api.user", "schema.profile"])
        self.assertEqual(step.primary_scope_paths, ["src/contracts"])
        self.assertEqual(step.shared_reviewed_paths, ["src/shared"])
        self.assertEqual(step.forbidden_core_paths, ["src/core"])

    def test_execution_plan_state_loads_legacy_payload_without_policy_fields(self) -> None:
        state = ExecutionPlanState.from_dict(
            {
                "title": "Legacy plan",
                "tasks": [
                    {
                        "step_id": "ST1",
                        "task_title": "Legacy feature",
                        "display_description": "Keep old plans readable.",
                        "depends_on": "ST0",
                        "owned_paths": "src/app.py, tests/test_app.py",
                    }
                ],
            }
        )

        self.assertEqual(len(state.steps), 1)
        self.assertEqual(state.steps[0].owned_paths, ["src/app.py", "tests/test_app.py"])
        normalize_execution_step_policy(state.steps[0])
        self.assertEqual(state.steps[0].step_type, "feature")
        self.assertEqual(state.steps[0].scope_class, "free_owned")
        self.assertEqual(state.steps[0].primary_scope_paths, ["src/app.py", "tests/test_app.py"])

    def test_guarded_overlap_classifier_green_yellow_red(self) -> None:
        green_step = normalize_execution_step_policy(
            ExecutionStep(
                step_id="ST1",
                title="Leaf feature",
                owned_paths=["src/feature"],
            )
        )
        green = classify_completed_lineage_step(
            green_step,
            changed_files=["src/feature/module.py"],
            verification_passed=True,
            batch_size=1,
            child_count=0,
        )
        self.assertEqual(green.promotion_class, "green")
        self.assertTrue(green.auto_promote_eligible)

        yellow_step = normalize_execution_step_policy(
            ExecutionStep(
                step_id="ST2",
                title="Shared helper pass",
                owned_paths=["src/feature"],
                shared_reviewed_paths=["src/shared"],
            )
        )
        yellow = classify_completed_lineage_step(
            yellow_step,
            changed_files=["src/shared/helper.py"],
            verification_passed=True,
            batch_size=1,
            child_count=0,
        )
        self.assertEqual(yellow.promotion_class, "yellow")
        self.assertFalse(yellow.auto_promote_eligible)

        red_step = normalize_execution_step_policy(
            ExecutionStep(
                step_id="ST3",
                title="Core touch",
                owned_paths=["src/feature"],
                forbidden_core_paths=["src/core"],
            )
        )
        red = classify_completed_lineage_step(
            red_step,
            changed_files=["src/core/runtime.py"],
            verification_passed=True,
            batch_size=1,
            child_count=0,
        )
        self.assertEqual(red.promotion_class, "red")
        self.assertFalse(red.auto_promote_eligible)

    def test_can_auto_promote_lineage_step_requires_green_assessment(self) -> None:
        orchestrator = Orchestrator(Path.cwd() / ".tmp_contract_wave_workspace")
        step = ExecutionStep(step_id="ST1", title="Leaf feature")

        green = classify_completed_lineage_step(
            normalize_execution_step_policy(ExecutionStep(step_id="ST1", title="Leaf feature", owned_paths=["src/feature"])),
            changed_files=["src/feature/module.py"],
            verification_passed=True,
            batch_size=1,
            child_count=0,
        )
        yellow = classify_completed_lineage_step(
            normalize_execution_step_policy(
                ExecutionStep(step_id="ST1", title="Shared pass", owned_paths=["src/feature"], shared_reviewed_paths=["src/shared"])
            ),
            changed_files=["src/shared/module.py"],
            verification_passed=True,
            batch_size=1,
            child_count=0,
        )

        self.assertTrue(orchestrator._can_auto_promote_lineage_step(step, {"ST1": 0}, batch_size=1, assessment=green))
        self.assertFalse(orchestrator._can_auto_promote_lineage_step(step, {"ST1": 0}, batch_size=1, assessment=yellow))

    def test_contract_wave_artifacts_persist_spine_crr_and_manifest(self) -> None:
        temp_root = Path(__file__).resolve().parents[1] / ".tmp_contract_wave_artifacts"
        shutil.rmtree(temp_root, ignore_errors=True)
        workspace_root = temp_root / "workspace"
        repo_dir = temp_root / "repo"
        repo_dir.mkdir(parents=True, exist_ok=True)
        manager = WorkspaceManager(workspace_root)
        context = manager.initialize_local_project(
            project_dir=repo_dir,
            branch="main",
            runtime=RuntimeOptions(model="gpt-5.4", effort="medium"),
        )

        try:
            step = normalize_execution_step_policy(
                ExecutionStep(
                    step_id="ST9",
                    title="Contract wave",
                    owned_paths=["src/contracts"],
                    step_type="contract",
                    scope_class="shared_reviewed",
                    shared_contracts=["api.user"],
                    shared_reviewed_paths=["src/shared"],
                    spine_version=current_spine_version(context.paths),
                )
            )
            assessment = classify_completed_lineage_step(
                step,
                changed_files=["src/contracts/user_contract.py", "src/shared/adapter.py"],
                verification_passed=True,
                batch_size=1,
                child_count=0,
            )
            manifest = build_lineage_manifest(
                lineage_id="LN1",
                step=step,
                changed_files=["src/contracts/user_contract.py", "src/shared/adapter.py"],
                diff_entries=[("A", "src/helpers/contract_helper.py"), ("M", "src/contracts/user_contract.py")],
                verification_command="python -m pytest tests/test_contracts.py",
                verification_summary="contracts passed",
                verification_passed=True,
                assessment=assessment,
                commit_hash="ln1-head",
            )
            _spine, _requirements, crr = update_contract_wave_artifacts_for_completion(
                context.paths,
                step=step,
                lineage_id="LN1",
                manifest=manifest,
                assessment=assessment,
            )
            manifest_path = save_lineage_manifest(context.paths, manifest)

            spine_state = load_spine_state(context.paths.spine_file)
            common_state = load_common_requirements_state(context.paths.common_requirements_file)
            manifests = load_lineage_manifests(context.paths, lineage_id="LN1")
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

        self.assertTrue(manifest_path.name.endswith(".json"))
        self.assertNotEqual(spine_state.current_version, DEFAULT_SPINE_VERSION)
        self.assertEqual(len(spine_state.history), 1)
        self.assertIsNotNone(crr)
        self.assertEqual(len(common_state.open_requirements), 1)
        self.assertEqual(common_state.open_requirements[0].request_id, crr.request_id)
        self.assertEqual(len(manifests), 1)
        self.assertEqual(manifests[0].new_helpers_added, ["src/helpers/contract_helper.py"])
        self.assertEqual(manifests[0].promotion_class, "yellow")

    def test_allocate_lineage_requires_explicit_join_for_multiple_dependencies(self) -> None:
        temp_root = Path(__file__).resolve().parents[1] / ".tmp_contract_wave_join_guard"
        shutil.rmtree(temp_root, ignore_errors=True)
        workspace_root = temp_root / "workspace"
        repo_dir = temp_root / "repo"
        repo_dir.mkdir(parents=True, exist_ok=True)
        orchestrator = Orchestrator(workspace_root)
        context = orchestrator.workspace.initialize_local_project(
            project_dir=repo_dir,
            branch="main",
            runtime=RuntimeOptions(model="gpt-5.4", effort="medium"),
        )
        plan_state = ExecutionPlanState(
            execution_mode="parallel",
            steps=[
                ExecutionStep(step_id="ST1", title="A"),
                ExecutionStep(step_id="ST2", title="B"),
                ExecutionStep(step_id="ST3", title="Illegal merge", depends_on=["ST1", "ST2"]),
            ],
        )

        try:
            with self.assertRaisesRegex(RuntimeError, "explicit join or barrier"):
                orchestrator._allocate_lineage_for_step(context, plan_state, plan_state.steps[2], {}, {})
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

    def test_yellow_lineage_step_skips_immediate_promotion(self) -> None:
        temp_root = Path(__file__).resolve().parents[1] / ".tmp_contract_wave_yellow_skip"
        shutil.rmtree(temp_root, ignore_errors=True)
        workspace_root = temp_root / "workspace"
        repo_dir = temp_root / "repo"
        repo_dir.mkdir(parents=True, exist_ok=True)
        orchestrator = Orchestrator(workspace_root)
        runtime = RuntimeOptions(model="gpt-5.4", effort="medium", test_cmd="python -m pytest", execution_mode="parallel")

        try:
            context = orchestrator.workspace.initialize_local_project(project_dir=repo_dir, branch="main", runtime=runtime)
            context.metadata.current_safe_revision = "safe-main"
            context.loop_state.current_safe_revision = "safe-main"
            orchestrator.workspace.save_project(context)
            orchestrator.save_execution_plan_state(
                context,
                ExecutionPlanState(
                    execution_mode="parallel",
                    default_test_command="python -m pytest",
                    steps=[
                        ExecutionStep(
                            step_id="ST1",
                            title="Shared adapter work",
                            owned_paths=["src/feature"],
                            shared_reviewed_paths=["src/shared"],
                            scope_class="shared_reviewed",
                        ),
                        ExecutionStep(step_id="ST2", title="Completed sibling", status="completed", metadata={"lineage_id": "LN2"}),
                        ExecutionStep(
                            step_id="ST3",
                            title="Join shared work",
                            depends_on=["ST1", "ST2"],
                            metadata={"step_kind": "join", "merge_from": ["ST1", "ST2"], "join_policy": "all"},
                        ),
                    ],
                ),
            )
            orchestrator._save_lineage_states(
                context,
                {
                    "LN2": LineageState(
                        lineage_id="LN2",
                        branch_name="jakal-flow-lineage-ln2",
                        worktree_dir=temp_root / "ln2" / "repo",
                        project_root=temp_root / "ln2",
                        created_at="2026-03-29T00:00:00+00:00",
                        updated_at="2026-03-29T00:00:00+00:00",
                        head_commit="ln2-head",
                        safe_revision="ln2-head",
                        status="merged",
                        merged_by_step_id="ST0",
                    ),
                },
            )
            worker_result = {
                "step_id": "ST1",
                "status": "completed",
                "notes": "shared work complete",
                "commit_hash": "ln1-step",
                "changed_files": ["src/shared/adapter.py"],
                "pass_log": {"pass_type": "block-search-pass"},
                "block_log": {"status": "completed"},
                "test_summary": "shared work complete",
                "head_commit": "ln1-head",
                "ml_report_payload": {},
            }

            with mock.patch.object(orchestrator, "setup_local_project", return_value=context), mock.patch.object(
                orchestrator.git,
                "add_worktree",
            ), mock.patch.object(
                orchestrator,
                "_parallel_worker_count",
                return_value=1,
            ), mock.patch.object(
                orchestrator,
                "_build_lineage_context",
                return_value=mock.Mock(name="yellow-lineage"),
            ), mock.patch.object(
                orchestrator,
                "_run_lineage_step_worker",
                return_value=worker_result,
            ), mock.patch.object(
                orchestrator,
                "_promote_lineage_to_target_branch",
            ) as mocked_promote, mock.patch.object(
                orchestrator,
                "_push_if_ready",
                return_value=(False, "already_up_to_date"),
            ):
                project, saved, steps = orchestrator.run_parallel_execution_batch(
                    project_dir=repo_dir,
                    runtime=runtime,
                    step_ids=["ST1"],
                )
                manifests = load_lineage_manifests(project.paths)
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

        self.assertEqual(saved.steps[0].promotion_class, "yellow")
        self.assertEqual(steps[0].commit_hash, "ln1-step")
        mocked_promote.assert_not_called()
        self.assertEqual(len(manifests), 1)
        self.assertEqual(manifests[0].promotion_class, "yellow")

    def test_promote_lineage_to_target_branch_rolls_back_on_push_failure(self) -> None:
        temp_root = Path(__file__).resolve().parents[1] / ".tmp_contract_wave_promotion_failure"
        shutil.rmtree(temp_root, ignore_errors=True)
        workspace_root = temp_root / "workspace"
        repo_dir = temp_root / "repo"
        repo_dir.mkdir(parents=True, exist_ok=True)
        orchestrator = Orchestrator(workspace_root)
        context = orchestrator.workspace.initialize_local_project(
            project_dir=repo_dir,
            branch="main",
            runtime=RuntimeOptions(model="gpt-5.4", effort="medium"),
        )
        context.metadata.current_safe_revision = "safe-main"
        context.loop_state.current_safe_revision = "safe-main"
        lineage = LineageState(
            lineage_id="LN1",
            branch_name="jakal-flow-lineage-ln1",
            worktree_dir=temp_root / "ln1" / "repo",
            project_root=temp_root / "ln1",
            created_at="2026-03-29T00:00:00+00:00",
            updated_at="2026-03-29T00:00:00+00:00",
            head_commit="ln1-head",
            safe_revision="ln1-head",
        )

        try:
            with mock.patch.object(orchestrator.git, "merge_ff_only"), mock.patch.object(
                orchestrator.git,
                "current_revision",
                return_value="main-promoted",
            ), mock.patch.object(
                orchestrator,
                "_push_if_ready",
                return_value=(False, "push_failed:network"),
            ), mock.patch.object(
                orchestrator.git,
                "hard_reset",
            ) as mocked_reset:
                promoted, reason, commit_hash = orchestrator._promote_lineage_to_target_branch(context, lineage)
        finally:
            shutil.rmtree(temp_root, ignore_errors=True)

        self.assertFalse(promoted)
        self.assertEqual(reason, "push_failed:network")
        self.assertIsNone(commit_hash)
        mocked_reset.assert_called_once_with(context.paths.repo_dir, "safe-main")
        self.assertEqual(context.metadata.current_safe_revision, "safe-main")
        self.assertEqual(context.loop_state.current_safe_revision, "safe-main")


if __name__ == "__main__":
    unittest.main()
