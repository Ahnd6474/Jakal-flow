const DEFAULT_PLANNING_STAGE_LABELS = Object.freeze({
  context_scan: "Scan repository context",
  planner_a: "Planner Agent A",
  planner_b: "Planner Agent B",
  finalize: "Validate and save plan",
});

const REFRESH_EVENT_TYPES = new Set([
  "step-finished",
  "batch-finished",
  "closeout-finished",
  "run-paused",
  "ml-cycle-stopped",
]);

function normalizedText(value = "") {
  return String(value || "").trim();
}

function normalizedRepoId(detail = null) {
  return normalizedText(detail?.project?.repo_id);
}

function parsePositiveInt(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePlanningStatus(value = "") {
  const normalized = normalizedText(value).toLowerCase();
  if (["completed", "failed", "running"].includes(normalized)) {
    return normalized;
  }
  return "running";
}

function planningStageLabel(stageKey = "", fallbackLabel = "") {
  const explicit = normalizedText(fallbackLabel);
  if (explicit) {
    return explicit;
  }
  const known = DEFAULT_PLANNING_STAGE_LABELS[normalizedText(stageKey).toLowerCase()];
  if (known) {
    return known;
  }
  const derived = normalizedText(stageKey).replaceAll("_", " ");
  if (!derived) {
    return "";
  }
  return derived.charAt(0).toUpperCase() + derived.slice(1);
}

function uniquePrepend(items = [], nextItem, limit = 8) {
  const nextItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!nextItem) {
    return nextItems.slice(0, limit);
  }
  const serialized = JSON.stringify(nextItem);
  const filtered = nextItems.filter((item) => JSON.stringify(item) !== serialized);
  return [nextItem, ...filtered].slice(0, limit);
}

export function projectUiEventRecord(eventPayload) {
  const payload = eventPayload?.payload;
  const event = payload?.event;
  if (!payload || typeof payload !== "object" || !event || typeof event !== "object") {
    return null;
  }
  return {
    repoId: normalizedText(payload.repo_id),
    projectDir: normalizedText(payload.project_dir),
    projectStatus: normalizedText(payload.project_status || payload.status),
    timestamp: normalizedText(event.timestamp),
    eventType: normalizedText(event.event_type),
    message: normalizedText(event.message),
    details: event.details && typeof event.details === "object" ? event.details : {},
    rawEvent: {
      timestamp: normalizedText(event.timestamp),
      event_type: normalizedText(event.event_type),
      message: normalizedText(event.message),
      details: event.details && typeof event.details === "object" ? event.details : {},
    },
  };
}

export function projectUiEventActivityLine(record) {
  if (!record) {
    return "";
  }
  const stepId = normalizedText(record.details?.step_id);
  const detailSuffix = stepId ? ` [${stepId}]` : "";
  return `${record.timestamp} | ${record.eventType}${detailSuffix} | ${record.message}`.trim();
}

function updatePlanningProgress(progress = null, record = null) {
  if (!record || normalizedText(record.details?.flow).toLowerCase() !== "planning") {
    return progress;
  }
  const stageIndex = parsePositiveInt(record.details?.stage_index, 0);
  const stageCount = Math.max(parsePositiveInt(record.details?.stage_count, 0), stageIndex);
  if (!stageIndex || !stageCount) {
    return progress;
  }
  const currentStatus = normalizePlanningStatus(record.details?.status);
  const currentStageKey = normalizedText(record.details?.stage_key).toLowerCase();
  const currentStageLabel = planningStageLabel(currentStageKey, record.details?.stage_label);
  const currentAgentLabel = normalizedText(record.details?.agent_label);
  const existingStages = Array.isArray(progress?.stages) ? progress.stages : [];
  const stageMap = new Map(
    existingStages
      .filter((stage) => stage && typeof stage === "object")
      .map((stage) => [parsePositiveInt(stage.index, 0), stage]),
  );
  const stages = Array.from({ length: stageCount }, (_, offset) => {
    const index = offset + 1;
    const existing = stageMap.get(index) || {};
    const existingKey = normalizedText(existing.key).toLowerCase();
    const stageKey = index === stageIndex ? currentStageKey || existingKey : existingKey;
    const stageLabel = planningStageLabel(stageKey, index === stageIndex ? currentStageLabel : existing.label);
    const stageStatus =
      index < stageIndex
        ? "completed"
        : index === stageIndex
          ? currentStatus
          : "pending";
    return {
      key: stageKey,
      index,
      label: stageLabel,
      status: stageStatus,
      agent_label: index === stageIndex ? currentAgentLabel || normalizedText(existing.agent_label) : normalizedText(existing.agent_label),
    };
  });

  const progressUnits =
    currentStatus === "completed"
      ? stageIndex
      : currentStatus === "failed"
        ? Math.max(0, stageIndex - 0.5)
        : Math.max(0, stageIndex - 0.5);
  const percent = stageCount ? Math.max(0, Math.min(100, Math.round((progressUnits / stageCount) * 100))) : 0;
  const completedStages = currentStatus === "completed" ? stageIndex : Math.max(0, stageIndex - 1);

  return {
    stage_count: stageCount,
    completed_stages: completedStages,
    percent,
    current_stage_key: currentStageKey,
    current_stage_index: stageIndex,
    current_stage_label: currentStageLabel,
    current_stage_status: currentStatus,
    current_agent_label: currentAgentLabel,
    message: record.message,
    event_type: record.eventType,
    stages,
  };
}

export function shouldRefreshProjectDetailForUiEvent(eventPayload) {
  const record = projectUiEventRecord(eventPayload);
  if (!record) {
    return false;
  }
  if (normalizedText(record.details?.flow).toLowerCase() === "planning") {
    return false;
  }
  return REFRESH_EVENT_TYPES.has(record.eventType);
}

export function applyProjectUiEvent(detail, eventPayload, options = {}) {
  const record = projectUiEventRecord(eventPayload);
  if (!detail || !record || normalizedRepoId(detail) !== record.repoId) {
    return detail;
  }

  const activityLimit = Math.max(1, parsePositiveInt(options.activityLimit, 8));
  const historyLimit = Math.max(1, parsePositiveInt(options.historyLimit, 40));
  const activityLine = projectUiEventActivityLine(record);

  const nextProject = detail.project
    ? {
        ...detail.project,
        current_status: record.projectStatus || detail.project.current_status,
        last_run_at:
          record.eventType === "project-state-synced"
            ? normalizedText(record.details?.last_run_at) || detail.project.last_run_at
            : detail.project.last_run_at,
      }
    : detail.project;

  const nextLoopState = detail.loop_state
    ? {
        ...detail.loop_state,
        current_task:
          record.eventType === "project-state-synced"
            ? normalizedText(record.details?.current_task)
            : detail.loop_state.current_task,
        pending_checkpoint_approval:
          record.eventType === "project-state-synced" && record.details?.pending_checkpoint_approval !== undefined
            ? Boolean(record.details.pending_checkpoint_approval)
            : detail.loop_state.pending_checkpoint_approval,
      }
    : detail.loop_state;

  const nextActivity = activityLine
    ? uniquePrepend(detail.activity, activityLine, activityLimit)
    : Array.isArray(detail.activity) ? detail.activity : [];

  const nextHistory = detail.history && typeof detail.history === "object"
    ? {
        ...detail.history,
        ui_events: uniquePrepend(detail.history.ui_events, record.rawEvent, historyLimit),
      }
    : detail.history;

  const nextBottomPanels = detail.bottom_panels && typeof detail.bottom_panels === "object"
    ? {
        ...detail.bottom_panels,
        execution_log_lines: activityLine
          ? uniquePrepend(detail.bottom_panels.execution_log_lines, activityLine, activityLimit)
          : detail.bottom_panels.execution_log_lines,
        git_status: detail.bottom_panels.git_status && typeof detail.bottom_panels.git_status === "object"
          ? {
              ...detail.bottom_panels.git_status,
              current_status: record.projectStatus || detail.bottom_panels.git_status.current_status,
              pending_checkpoint_approval:
                record.eventType === "project-state-synced" && record.details?.pending_checkpoint_approval !== undefined
                  ? Boolean(record.details.pending_checkpoint_approval)
                  : detail.bottom_panels.git_status.pending_checkpoint_approval,
            }
          : detail.bottom_panels.git_status,
      }
    : detail.bottom_panels;

  const nextSnapshot = detail.snapshot && typeof detail.snapshot === "object"
    ? {
        ...detail.snapshot,
        project: detail.snapshot.project && typeof detail.snapshot.project === "object"
          ? {
              ...detail.snapshot.project,
              current_status: record.projectStatus || detail.snapshot.project.current_status,
              last_run_at:
                record.eventType === "project-state-synced"
                  ? normalizedText(record.details?.last_run_at) || detail.snapshot.project.last_run_at
                  : detail.snapshot.project.last_run_at,
            }
          : detail.snapshot.project,
        loop_state: detail.snapshot.loop_state && typeof detail.snapshot.loop_state === "object"
          ? {
              ...detail.snapshot.loop_state,
              current_task:
                record.eventType === "project-state-synced"
                  ? normalizedText(record.details?.current_task)
                  : detail.snapshot.loop_state.current_task,
              pending_checkpoint_approval:
                record.eventType === "project-state-synced" && record.details?.pending_checkpoint_approval !== undefined
                  ? Boolean(record.details.pending_checkpoint_approval)
                  : detail.snapshot.loop_state.pending_checkpoint_approval,
            }
          : detail.snapshot.loop_state,
      }
    : detail.snapshot;

  return {
    ...detail,
    project: nextProject,
    loop_state: nextLoopState,
    activity: nextActivity,
    history: nextHistory,
    bottom_panels: nextBottomPanels,
    snapshot: nextSnapshot,
    planning_progress: updatePlanningProgress(detail.planning_progress, record),
  };
}
