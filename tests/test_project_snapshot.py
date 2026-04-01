from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow.models import ExecutionPlanState, ExecutionStep, LoopState
from jakal_flow.project_snapshot import project_execution_snapshot


def test_project_execution_snapshot_marks_planning_as_running() -> None:
    snapshot = project_execution_snapshot(
        "setup_ready",
        ExecutionPlanState(steps=[]),
        LoopState(repo_id="repo-1", repo_slug="repo-1"),
        planning_progress={
            "current_stage_status": "running",
            "current_stage_index": 2,
        },
    )

    assert snapshot.current_status == "running:generate-plan"
    assert snapshot.display_status == "running:generate-plan"
    assert snapshot.planning_running is True
    assert snapshot.is_running is True
    assert snapshot.waiting_for_checkpoint_approval is False


def test_project_execution_snapshot_can_keep_raw_running_display_for_monitors() -> None:
    snapshot = project_execution_snapshot(
        "running:st1",
        ExecutionPlanState(
            steps=[
                ExecutionStep(step_id="ST1", title="Build", status="completed"),
            ],
            closeout_status="completed",
        ),
        LoopState(repo_id="repo-1", repo_slug="repo-1"),
        prefer_raw_running_display=True,
    )

    assert snapshot.current_status == "closed_out"
    assert snapshot.display_status == "running:st1"
    assert snapshot.is_running is False
