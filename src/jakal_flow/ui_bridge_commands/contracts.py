from __future__ import annotations

from ..contract_wave import (
    delete_common_requirement,
    delete_spine_checkpoint,
    record_manual_spine_checkpoint,
    set_common_requirement_status,
    update_common_requirement,
    update_spine_checkpoint,
)
from .context import BridgeCommandContext, BridgeCommandHandler


def build_contract_command_handlers(
    *,
    resolve_project,
    append_ui_event,
) -> dict[str, BridgeCommandHandler]:
    def resolve_common_requirement(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        request_id = str(ctx.payload.get("request_id", "")).strip()
        if not request_id:
            raise ValueError("request_id is required.")
        note = str(ctx.payload.get("note", "")).strip()
        _spine, _requirements, record = set_common_requirement_status(
            project.paths,
            request_id=request_id,
            status="resolved",
            note=note,
        )
        append_ui_event(
            project,
            "common-requirement-resolved",
            f"Resolved common requirement {record.request_id}.",
            {
                "request_id": record.request_id,
                "status": record.status,
                "resolved_at": record.resolved_at,
                "promotion_class": record.promotion_class,
                "note": note,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def reopen_common_requirement(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        request_id = str(ctx.payload.get("request_id", "")).strip()
        if not request_id:
            raise ValueError("request_id is required.")
        note = str(ctx.payload.get("note", "")).strip()
        _spine, _requirements, record = set_common_requirement_status(
            project.paths,
            request_id=request_id,
            status="open",
            note=note,
        )
        append_ui_event(
            project,
            "common-requirement-reopened",
            f"Reopened common requirement {record.request_id}.",
            {
                "request_id": record.request_id,
                "status": record.status,
                "promotion_class": record.promotion_class,
                "note": note,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def record_spine_checkpoint(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        version = str(ctx.payload.get("version", "")).strip()
        notes = str(ctx.payload.get("notes", "")).strip()
        shared_contracts = ctx.payload.get("shared_contracts", [])
        touched_files = ctx.payload.get("touched_files", [])
        step_id = str(ctx.payload.get("step_id", "")).strip()
        lineage_id = str(ctx.payload.get("lineage_id", "")).strip()
        commit_hash = str(ctx.payload.get("commit_hash", "")).strip()
        _spine, _requirements, checkpoint = record_manual_spine_checkpoint(
            project.paths,
            version=version,
            notes=notes,
            shared_contracts=shared_contracts,
            touched_files=touched_files,
            step_id=step_id,
            lineage_id=lineage_id,
            commit_hash=commit_hash,
        )
        append_ui_event(
            project,
            "spine-checkpoint-recorded",
            f"Recorded spine checkpoint {checkpoint.version}.",
            {
                "version": checkpoint.version,
                "step_id": checkpoint.step_id,
                "lineage_id": checkpoint.lineage_id,
                "shared_contracts": checkpoint.shared_contracts,
                "touched_files": checkpoint.touched_files,
                "notes": checkpoint.notes,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def update_common_requirement_details(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        request_id = str(ctx.payload.get("request_id", "")).strip()
        if not request_id:
            raise ValueError("request_id is required.")
        _spine, _requirements, record = update_common_requirement(
            project.paths,
            request_id=request_id,
            title=ctx.payload.get("title", ""),
            reason=ctx.payload.get("reason", ""),
            notes=ctx.payload.get("notes", ""),
            affected_paths=ctx.payload.get("affected_paths", []),
            shared_contracts=ctx.payload.get("shared_contracts", []),
            promotion_class=ctx.payload.get("promotion_class", ""),
            step_id=ctx.payload.get("step_id", ""),
            lineage_id=ctx.payload.get("lineage_id", ""),
            spine_version=ctx.payload.get("spine_version", ""),
        )
        append_ui_event(
            project,
            "common-requirement-updated",
            f"Updated common requirement {record.request_id}.",
            {
                "request_id": record.request_id,
                "promotion_class": record.promotion_class,
                "status": record.status,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def delete_common_requirement_record(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        request_id = str(ctx.payload.get("request_id", "")).strip()
        if not request_id:
            raise ValueError("request_id is required.")
        note = str(ctx.payload.get("note", "")).strip()
        _spine, _requirements, removed = delete_common_requirement(
            project.paths,
            request_id=request_id,
            note=note,
        )
        append_ui_event(
            project,
            "common-requirement-deleted",
            f"Removed common requirement {removed.request_id}.",
            {
                "request_id": removed.request_id,
                "status": removed.status,
                "note": note,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def update_spine_checkpoint_details(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        checkpoint_id = str(ctx.payload.get("checkpoint_id", "")).strip()
        if not checkpoint_id:
            raise ValueError("checkpoint_id is required.")
        _spine, _requirements, checkpoint = update_spine_checkpoint(
            project.paths,
            checkpoint_id=checkpoint_id,
            version=ctx.payload.get("version", ""),
            notes=ctx.payload.get("notes", ""),
            shared_contracts=ctx.payload.get("shared_contracts", []),
            touched_files=ctx.payload.get("touched_files", []),
            step_id=ctx.payload.get("step_id", ""),
            lineage_id=ctx.payload.get("lineage_id", ""),
            commit_hash=ctx.payload.get("commit_hash", ""),
        )
        append_ui_event(
            project,
            "spine-checkpoint-updated",
            f"Updated spine checkpoint {checkpoint.version}.",
            {
                "checkpoint_id": checkpoint.checkpoint_id,
                "version": checkpoint.version,
                "step_id": checkpoint.step_id,
                "lineage_id": checkpoint.lineage_id,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    def delete_spine_checkpoint_record(ctx: BridgeCommandContext) -> dict:
        project = resolve_project(ctx.orchestrator, ctx.payload)
        checkpoint_id = str(ctx.payload.get("checkpoint_id", "")).strip()
        if not checkpoint_id:
            raise ValueError("checkpoint_id is required.")
        note = str(ctx.payload.get("note", "")).strip()
        _spine, _requirements, removed = delete_spine_checkpoint(
            project.paths,
            checkpoint_id=checkpoint_id,
            note=note,
        )
        append_ui_event(
            project,
            "spine-checkpoint-deleted",
            f"Removed spine checkpoint {removed.version}.",
            {
                "checkpoint_id": removed.checkpoint_id,
                "version": removed.version,
                "note": note,
            },
        )
        return ctx.detail_payload(project, refresh_codex_status=False, detail_level="full")

    return {
        "resolve-common-requirement": resolve_common_requirement,
        "reopen-common-requirement": reopen_common_requirement,
        "record-spine-checkpoint": record_spine_checkpoint,
        "update-common-requirement": update_common_requirement_details,
        "delete-common-requirement": delete_common_requirement_record,
        "update-spine-checkpoint": update_spine_checkpoint_details,
        "delete-spine-checkpoint": delete_spine_checkpoint_record,
    }
