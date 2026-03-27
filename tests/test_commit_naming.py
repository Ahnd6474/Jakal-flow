from __future__ import annotations

import shutil
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow.commit_naming import build_commit_descriptor, build_initial_commit_descriptor
from jakal_flow.models import ExecutionStep, RuntimeOptions
from jakal_flow.workspace import WorkspaceManager


class CommitNamingTests(unittest.TestCase):
    def _context(self):
        method_token = self._testMethodName.replace("test_", "")[:24]
        temp_root = Path(__file__).resolve().parents[1] / ".tmp_commit_naming_tests" / method_token
        shutil.rmtree(temp_root, ignore_errors=True)
        repo_dir = temp_root / "repo"
        repo_dir.mkdir(parents=True, exist_ok=True)
        runtime = RuntimeOptions()
        manager = WorkspaceManager(temp_root / "workspace")
        context = manager.initialize_local_project(
            project_dir=repo_dir,
            branch="main",
            runtime=runtime,
            display_name="Demo Project",
        )
        self.addCleanup(shutil.rmtree, temp_root, True)
        return context

    def test_initial_commit_uses_planner_identity(self) -> None:
        context = self._context()

        descriptor = build_initial_commit_descriptor(context)

        self.assertEqual(descriptor.author_name, "Jakal-Flow-planner")
        self.assertEqual(descriptor.message, "Demo Project plan generation")

    def test_regular_debug_commit_uses_debugger_identity(self) -> None:
        context = self._context()
        step = ExecutionStep(step_id="ST1", title="Implement dashboard")

        descriptor = build_commit_descriptor(
            context,
            "block-search-debug",
            step.title,
            execution_step=step,
        )

        self.assertEqual(descriptor.author_name, "Jakal-Flow-debugger")
        self.assertEqual(descriptor.message, "Implement dashboard debugging")

    def test_parallel_worker_commit_uses_step_identity(self) -> None:
        context = self._context()
        context.metadata.repo_id = f"{context.metadata.repo_id}:node-a"
        context.metadata.branch = "jakal-flow-parallel-demo-node-a"
        step = ExecutionStep(step_id="node-a", title="Desktop slice")

        descriptor = build_commit_descriptor(
            context,
            "block-search-pass",
            step.title,
            execution_step=step,
        )

        self.assertEqual(descriptor.author_name, "Jakal-Flow-node-a")
        self.assertEqual(descriptor.message, "Desktop slice")

    def test_parallel_merge_debug_commit_uses_conflict_resolution_title(self) -> None:
        context = self._context()
        batch_step = ExecutionStep(
            step_id="BATCH",
            title="Recover merged parallel batch ST1, ST2",
            metadata={"parallel_step_titles": ["Desktop slice", "Backend slice"]},
        )

        descriptor = build_commit_descriptor(
            context,
            "parallel-batch-merge-debug",
            batch_step.title,
            execution_step=batch_step,
        )

        self.assertEqual(descriptor.author_name, "Jakal-Flow-merge-resolver")
        self.assertEqual(descriptor.message, "Desktop slice, Backend slice conflict resolution")

    def test_project_optimization_commit_uses_mode_in_subject(self) -> None:
        context = self._context()

        descriptor = build_commit_descriptor(
            context,
            "project-optimization-pass",
            "Pre-closeout optimization (light)",
        )

        self.assertEqual(descriptor.author_name, "Jakal-Flow-optimizer")
        self.assertEqual(descriptor.message, "Demo Project optimization (light)")


if __name__ == "__main__":
    unittest.main()
