import test from "node:test";
import assert from "node:assert/strict";

import { compactBridgeEventQueue } from "./bridgeEvents.js";

function projectUiEvent(eventType, stepId) {
  return {
    event: "project.ui_event",
    payload: {
      repo_id: "repo-1",
      project_dir: "C:/repo",
      event: {
        event_type: eventType,
        details: stepId ? { step_id: stepId } : {},
      },
    },
  };
}

test("compactBridgeEventQueue keeps parallel step events for different steps", () => {
  const compacted = compactBridgeEventQueue([
    projectUiEvent("step-started", "ST1"),
    projectUiEvent("step-started", "ST2"),
  ]);

  assert.equal(compacted.length, 2);
  assert.equal(compacted[0]?.payload?.event?.details?.step_id, "ST1");
  assert.equal(compacted[1]?.payload?.event?.details?.step_id, "ST2");
});

test("compactBridgeEventQueue replaces duplicate step events for the same step", () => {
  const compacted = compactBridgeEventQueue([
    projectUiEvent("step-started", "ST1"),
    {
      event: "project.ui_event",
      payload: {
        repo_id: "repo-1",
        project_dir: "C:/repo",
        event: {
          event_type: "step-started",
          message: "updated",
          details: { step_id: "ST1" },
        },
      },
    },
  ]);

  assert.equal(compacted.length, 1);
  assert.equal(compacted[0]?.payload?.event?.message, "updated");
});
