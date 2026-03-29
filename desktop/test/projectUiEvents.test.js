import assert from "node:assert/strict";
import test from "node:test";

import {
  applyProjectUiEvent,
  projectUiEventActivityLine,
  projectUiEventRecord,
  shouldRefreshProjectDetailForUiEvent,
} from "../src/controller/projectUiEvents.js";

function sampleEvent(eventType, overrides = {}) {
  return {
    event: "project.ui_event",
    payload: {
      repo_id: "repo-1",
      project_dir: "C:/work/repo-1",
      project_status: "running:parallel",
      event: {
        timestamp: "2026-03-30T00:00:00+00:00",
        event_type: eventType,
        message: "Updated project state.",
        details: {},
        ...(overrides.event || {}),
      },
      ...(overrides.payload || {}),
    },
  };
}

test("projectUiEventRecord extracts normalized event data", () => {
  const record = projectUiEventRecord(
    sampleEvent("project-state-synced", {
      event: {
        details: {
          current_task: "Run ST2",
          pending_checkpoint_approval: true,
        },
      },
    }),
  );

  assert.equal(record.repoId, "repo-1");
  assert.equal(record.projectStatus, "running:parallel");
  assert.equal(record.details.current_task, "Run ST2");
});

test("projectUiEventActivityLine includes the step id suffix when available", () => {
  const line = projectUiEventActivityLine(
    projectUiEventRecord(
      sampleEvent("step-finished", {
        event: {
          details: {
            step_id: "ST2",
          },
        },
      }),
    ),
  );

  assert.equal(line, "2026-03-30T00:00:00+00:00 | step-finished [ST2] | Updated project state.");
});

test("applyProjectUiEvent patches local detail without clearing existing history", () => {
  const detail = {
    project: {
      repo_id: "repo-1",
      current_status: "running:step",
      last_run_at: "",
    },
    loop_state: {
      current_task: "",
      pending_checkpoint_approval: false,
    },
    activity: ["older line"],
    history: {
      ui_events: [{ event_type: "older" }],
    },
    bottom_panels: {
      execution_log_lines: ["older line"],
      git_status: {
        current_status: "running:step",
        pending_checkpoint_approval: false,
      },
    },
    snapshot: {
      project: {
        current_status: "running:step",
        last_run_at: "",
      },
      loop_state: {
        current_task: "",
        pending_checkpoint_approval: false,
      },
    },
  };

  const updated = applyProjectUiEvent(
    detail,
    sampleEvent("project-state-synced", {
      event: {
        details: {
          current_task: "Run ST2",
          pending_checkpoint_approval: true,
          last_run_at: "2026-03-30T00:00:01+00:00",
        },
      },
    }),
  );

  assert.equal(updated.project.current_status, "running:parallel");
  assert.equal(updated.project.last_run_at, "2026-03-30T00:00:01+00:00");
  assert.equal(updated.loop_state.current_task, "Run ST2");
  assert.equal(updated.loop_state.pending_checkpoint_approval, true);
  assert.equal(updated.activity[0], "2026-03-30T00:00:00+00:00 | project-state-synced | Updated project state.");
  assert.equal(updated.history.ui_events[0].event_type, "project-state-synced");
  assert.equal(updated.bottom_panels.git_status.pending_checkpoint_approval, true);
});

test("applyProjectUiEvent updates planning progress from planning events", () => {
  const updated = applyProjectUiEvent(
    {
      project: { repo_id: "repo-1" },
      planning_progress: null,
    },
    sampleEvent("planner-agent-started", {
      event: {
        details: {
          flow: "planning",
          stage_key: "planner_a",
          stage_index: 2,
          stage_count: 4,
          status: "running",
          agent_label: "Planner Agent A",
        },
      },
    }),
  );

  assert.equal(updated.planning_progress.current_stage_index, 2);
  assert.equal(updated.planning_progress.current_stage_status, "running");
  assert.equal(updated.planning_progress.stages[1].label, "Planner Agent A");
});

test("shouldRefreshProjectDetailForUiEvent only reloads for structural run updates", () => {
  assert.equal(shouldRefreshProjectDetailForUiEvent(sampleEvent("step-started")), false);
  assert.equal(shouldRefreshProjectDetailForUiEvent(sampleEvent("step-finished")), true);
  assert.equal(
    shouldRefreshProjectDetailForUiEvent(
      sampleEvent("planner-agent-started", {
        event: {
          details: {
            flow: "planning",
            stage_key: "planner_a",
            stage_index: 2,
            stage_count: 4,
          },
        },
      }),
    ),
    false,
  );
});
