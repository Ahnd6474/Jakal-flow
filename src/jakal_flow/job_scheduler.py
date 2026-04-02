from __future__ import annotations

from dataclasses import asdict, dataclass, field, is_dataclass
import os
from pathlib import Path
from typing import Any

from .utils import append_jsonl, ensure_dir, now_utc_iso, read_json, write_json


DEFAULT_MAX_CONCURRENT_JOBS = 2
ACTIVE_SCHEDULER_JOB_STATUSES = frozenset({"queued", "running"})
VALID_SCHEDULER_JOB_LANES = frozenset({"chat", "execution"})


def _normalize(value: Any) -> Any:
    if isinstance(value, Path):
        return str(value)
    if is_dataclass(value):
        return {key: _normalize(item) for key, item in asdict(value).items()}
    if isinstance(value, dict):
        return {str(key): _normalize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    return value


def normalize_max_concurrent_jobs(value: Any, default: int = DEFAULT_MAX_CONCURRENT_JOBS) -> int:
    try:
        parsed = int(str(value).strip())
    except (TypeError, ValueError):
        parsed = default
    return max(1, parsed)


def normalize_scheduler_project_path(value: str | Path | None) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    try:
        resolved = Path(text).expanduser().resolve()
    except OSError:
        resolved = Path(text).expanduser()
    normalized = str(resolved)
    return normalized.lower() if os.name == "nt" else normalized


def normalize_scheduler_job_lane(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    return normalized if normalized in VALID_SCHEDULER_JOB_LANES else "execution"


def scheduler_state_file(workspace_root: Path) -> Path:
    return workspace_root / "job_scheduler.json"


def scheduler_event_log_file(workspace_root: Path) -> Path:
    return workspace_root / "job_scheduler_events.jsonl"


@dataclass(slots=True)
class WorkspaceSchedulerState:
    workspace_root: Path
    max_concurrent_jobs: int = DEFAULT_MAX_CONCURRENT_JOBS
    updated_at: str | None = None
    jobs: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return _normalize(self)


def load_scheduler_state(
    workspace_root: Path,
    *,
    default_max_concurrent_jobs: Any | None = None,
) -> WorkspaceSchedulerState:
    default_limit = normalize_max_concurrent_jobs(
        os.environ.get("JAKAL_FLOW_MAX_CONCURRENT_JOBS", DEFAULT_MAX_CONCURRENT_JOBS)
        if default_max_concurrent_jobs is None
        else default_max_concurrent_jobs,
        default=DEFAULT_MAX_CONCURRENT_JOBS,
    )
    raw = read_json(scheduler_state_file(workspace_root), default=None)
    if not isinstance(raw, dict):
        return WorkspaceSchedulerState(
            workspace_root=workspace_root,
            max_concurrent_jobs=default_limit,
        )
    raw_jobs = raw.get("jobs", [])
    jobs = [dict(item) for item in raw_jobs if isinstance(item, dict)]
    updated_at = str(raw.get("updated_at", "")).strip() or None
    return WorkspaceSchedulerState(
        workspace_root=workspace_root,
        max_concurrent_jobs=normalize_max_concurrent_jobs(raw.get("max_concurrent_jobs"), default=default_limit),
        updated_at=updated_at,
        jobs=jobs,
    )


def _coerce_scheduler_state(
    state_or_workspace_root: WorkspaceSchedulerState | Path,
    *,
    default_max_concurrent_jobs: Any | None = None,
) -> WorkspaceSchedulerState:
    if isinstance(state_or_workspace_root, WorkspaceSchedulerState):
        return state_or_workspace_root
    return load_scheduler_state(
        state_or_workspace_root,
        default_max_concurrent_jobs=default_max_concurrent_jobs,
    )


def active_scheduler_jobs(
    state_or_workspace_root: WorkspaceSchedulerState | Path,
    *,
    statuses: set[str] | frozenset[str] | tuple[str, ...] = ACTIVE_SCHEDULER_JOB_STATUSES,
    default_max_concurrent_jobs: Any | None = None,
) -> list[dict[str, Any]]:
    state = _coerce_scheduler_state(
        state_or_workspace_root,
        default_max_concurrent_jobs=default_max_concurrent_jobs,
    )
    normalized_statuses = {str(item).strip().lower() for item in statuses}
    return [
        dict(job)
        for job in state.jobs
        if isinstance(job, dict) and str(job.get("status", "")).strip().lower() in normalized_statuses
    ]


def running_scheduler_job_count(
    state_or_workspace_root: WorkspaceSchedulerState | Path,
    *,
    default_max_concurrent_jobs: Any | None = None,
) -> int:
    return sum(
        1
        for job in active_scheduler_jobs(
            state_or_workspace_root,
            statuses=("running",),
            default_max_concurrent_jobs=default_max_concurrent_jobs,
        )
    )


def matching_active_scheduler_job(
    state_or_workspace_root: WorkspaceSchedulerState | Path,
    *,
    repo_id: str = "",
    project_dir: str | Path | None = None,
    job_lane: str = "execution",
    default_max_concurrent_jobs: Any | None = None,
) -> dict[str, Any] | None:
    normalized_repo_id = str(repo_id or "").strip()
    normalized_project_dir = normalize_scheduler_project_path(project_dir)
    normalized_lane = normalize_scheduler_job_lane(job_lane)
    for job in active_scheduler_jobs(
        state_or_workspace_root,
        default_max_concurrent_jobs=default_max_concurrent_jobs,
    ):
        if normalize_scheduler_job_lane(job.get("job_lane")) != normalized_lane:
            continue
        if normalized_repo_id and str(job.get("repo_id", "")).strip() == normalized_repo_id:
            return job
        if normalized_project_dir and normalize_scheduler_project_path(job.get("project_dir")) == normalized_project_dir:
            return job
    return None


def write_scheduler_state(
    workspace_root: Path,
    *,
    max_concurrent_jobs: int,
    jobs: list[dict[str, Any]],
) -> None:
    ensure_dir(workspace_root)
    write_json(
        scheduler_state_file(workspace_root),
        WorkspaceSchedulerState(
            workspace_root=workspace_root,
            max_concurrent_jobs=normalize_max_concurrent_jobs(max_concurrent_jobs),
            updated_at=now_utc_iso(),
            jobs=jobs,
        ).to_dict(),
    )


def append_scheduler_event(
    workspace_root: Path,
    event_type: str,
    *,
    job: dict[str, Any],
    details: dict[str, Any] | None = None,
) -> None:
    append_jsonl(
        scheduler_event_log_file(workspace_root),
        {
            "timestamp": now_utc_iso(),
            "event_type": str(event_type).strip() or "scheduler-event",
            "job": job,
            "details": details or {},
        },
    )
