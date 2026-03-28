from __future__ import annotations

import json
from pathlib import Path
import traceback
from typing import Any, Iterable

from .models import ProjectContext
from .utils import compact_text, ensure_dir, now_utc_iso, write_text

_TEXT_PREVIEW_SUFFIXES = {
    ".json",
    ".jsonl",
    ".log",
    ".md",
    ".prompt",
    ".stderr",
    ".stdout",
    ".txt",
}


def _artifact_kind(path: Path) -> str:
    name = path.name.lower()
    if name.endswith(".stderr.log"):
        return "stderr_log"
    if name.endswith(".stdout.log"):
        return "stdout_log"
    if name.endswith(".events.jsonl"):
        return "event_log"
    if name.endswith(".diagnostics.json"):
        return "diagnostics"
    if name.endswith(".last_message.txt"):
        return "last_message"
    if name.endswith(".prompt.md"):
        return "prompt"
    if name.endswith(".jsonl"):
        return "jsonl"
    if name.endswith(".json"):
        return "json"
    if name.endswith(".md"):
        return "markdown"
    if name.endswith(".txt"):
        return "text"
    return "file"


def _artifact_priority(path: Path) -> tuple[int, str]:
    kind = _artifact_kind(path)
    priority_map = {
        "stderr_log": 0,
        "diagnostics": 1,
        "event_log": 2,
        "stdout_log": 3,
        "last_message": 4,
        "prompt": 5,
        "json": 6,
        "jsonl": 7,
        "markdown": 8,
        "text": 9,
        "file": 10,
    }
    return priority_map.get(kind, 99), path.name.lower()


def _preview_text(path: Path, max_chars: int) -> str:
    suffixes = {suffix.lower() for suffix in path.suffixes}
    if not suffixes.intersection(_TEXT_PREVIEW_SUFFIXES):
        return ""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""
    return compact_text(text, max_chars=max_chars)


def _artifact_entry(path: Path, *, max_preview_chars: int) -> dict[str, Any]:
    try:
        stat = path.stat()
        size_bytes = int(stat.st_size)
    except OSError:
        size_bytes = 0
    return {
        "path": str(path),
        "name": path.name,
        "kind": _artifact_kind(path),
        "size_bytes": size_bytes,
        "preview": _preview_text(path, max_chars=max_preview_chars),
    }


def collect_failure_artifacts(
    context: ProjectContext,
    *,
    block_index: int | None = None,
    extra_paths: Iterable[Path] | None = None,
    max_entries: int = 24,
    max_preview_chars: int = 1_600,
) -> list[dict[str, Any]]:
    candidates: list[Path] = []
    if isinstance(block_index, int) and block_index >= 0:
        block_dir = context.paths.logs_dir / f"block_{block_index:04d}"
        if block_dir.exists():
            try:
                candidates.extend(path for path in block_dir.iterdir() if path.is_file())
            except OSError:
                pass
    for path in [
        context.paths.logs_dir / "project_activity.jsonl",
        context.paths.ui_event_log_file,
        context.paths.logs_dir / "test_runs.jsonl",
        context.paths.pass_log_file,
        context.paths.block_log_file,
        context.paths.reports_dir / "latest_report.json",
        context.paths.loop_state_file,
        context.paths.execution_plan_file,
    ]:
        if path.exists():
            candidates.append(path)
    if extra_paths:
        for extra_path in extra_paths:
            path = Path(extra_path)
            if path.exists() and path.is_file():
                candidates.append(path)

    seen: set[Path] = set()
    ordered: list[Path] = []
    for path in sorted(candidates, key=_artifact_priority):
        resolved = path.resolve()
        if resolved in seen:
            continue
        seen.add(resolved)
        ordered.append(path)
        if len(ordered) >= max_entries:
            break
    return [_artifact_entry(path, max_preview_chars=max_preview_chars) for path in ordered]


def write_runtime_failure_log(
    workspace_root: Path,
    *,
    source: str,
    command: str,
    exc: BaseException,
    payload: dict[str, Any] | None = None,
    project: ProjectContext | None = None,
) -> Path:
    generated_at = now_utc_iso()
    timestamp_token = "".join(char for char in generated_at if char.isdigit())[:14] or "00000000000000"
    safe_source = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in source.strip().lower()).strip("-") or "runtime"
    safe_command = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in command.strip().lower()).strip("-") or "command"
    target_dir = ensure_dir(project.paths.reports_dir) if project is not None else ensure_dir(workspace_root / "crash_logs")
    log_path = target_dir / f"{timestamp_token}_{safe_source}_{safe_command}.crash.log"
    payload_text = json.dumps(payload or {}, indent=2, sort_keys=True, ensure_ascii=False, default=str)
    traceback_text = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    project_lines: list[str] = []
    if project is not None:
        project_lines.extend(
            [
                f"repo_id: {project.metadata.repo_id}",
                f"project_root: {project.paths.project_root}",
                f"repo_dir: {project.metadata.repo_path}",
                f"branch: {project.metadata.branch}",
            ]
        )
    content = "\n".join(
        [
            "# jakal-flow runtime failure",
            f"generated_at: {generated_at}",
            f"source: {source}",
            f"command: {command}",
            f"workspace_root: {workspace_root}",
            *project_lines,
            f"exception_type: {type(exc).__name__}",
            f"exception_message: {str(exc).strip() or 'unknown_error'}",
            "",
            "## Payload",
            payload_text,
            "",
            "## Traceback",
            traceback_text.rstrip(),
            "",
        ]
    )
    write_text(log_path, content)
    return log_path
