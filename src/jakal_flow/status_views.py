from __future__ import annotations

from .models import ExecutionPlanState, LoopState


def status_from_plan_state(plan_state: ExecutionPlanState) -> str:
    if not plan_state.steps:
        return "setup_ready"
    running_steps = [step for step in plan_state.steps if step.status == "running"]
    if running_steps:
        if len(running_steps) == 1:
            return f"running:{running_steps[0].step_id.lower()}"
        return "running:parallel"
    if any(step.status != "completed" for step in plan_state.steps):
        return "plan_ready"
    if plan_state.closeout_status == "completed":
        return "closed_out"
    if plan_state.closeout_status == "running":
        return "running:closeout"
    if plan_state.closeout_status == "failed":
        return "closeout_failed"
    return "plan_completed"


def effective_project_status(
    raw_status: str | None,
    plan_state: ExecutionPlanState,
    loop_state: LoopState,
) -> str:
    normalized = str(raw_status or "").strip()
    if loop_state.pending_checkpoint_approval:
        return "awaiting_checkpoint_approval"
    if normalized.lower() == "awaiting_checkpoint_approval":
        return status_from_plan_state(plan_state)
    return normalized or status_from_plan_state(plan_state)
