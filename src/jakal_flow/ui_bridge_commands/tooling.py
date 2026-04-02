from __future__ import annotations

from typing import Any

from ..step_models import provider_statuses_payload
from ..tooling_manager import get_tooling_statuses, run_tooling_action
from .context import BridgeCommandContext, BridgeCommandHandler


def tooling_snapshot_payload(
    *,
    codex_snapshot_service,
    force_refresh: bool = False,
) -> dict[str, Any]:
    fetch_snapshot = lambda codex_path="": codex_snapshot_service.get_snapshot(  # noqa: E731
        codex_path,
        force_refresh=force_refresh,
    )
    codex_status = fetch_snapshot().to_dict()
    codex_status["provider_statuses"] = provider_statuses_payload(
        fetch_snapshot=fetch_snapshot,
        force_refresh=force_refresh,
    )
    return {
        "codex_status": codex_status,
        "model_catalog": codex_status.get("model_catalog", []),
        "tooling_statuses": get_tooling_statuses(force_refresh=force_refresh),
    }


def build_tooling_command_handlers(
    *,
    coerce_bool,
    codex_snapshot_service,
) -> dict[str, BridgeCommandHandler]:
    def get_tooling_status(ctx: BridgeCommandContext) -> dict[str, Any]:
        force_refresh = coerce_bool(ctx.payload.get("force_refresh", False), False)
        return {
            **tooling_snapshot_payload(
                codex_snapshot_service=codex_snapshot_service,
                force_refresh=force_refresh,
            ),
            "emit_project_changed": False,
        }

    def manage_tooling(ctx: BridgeCommandContext) -> dict[str, Any]:
        action = str(ctx.payload.get("action", "")).strip().lower()
        tool = str(ctx.payload.get("tool", "")).strip().lower()
        model = str(ctx.payload.get("model", "")).strip().lower()
        action_result = run_tooling_action(
            ctx.workspace_root,
            action=action,
            tool=tool,
            model=model,
        )
        return {
            **tooling_snapshot_payload(
                codex_snapshot_service=codex_snapshot_service,
                force_refresh=True,
            ),
            "tooling_action": action_result,
            "emit_project_changed": False,
        }

    return {
        "get-tooling-status": get_tooling_status,
        "manage-tooling": manage_tooling,
    }
