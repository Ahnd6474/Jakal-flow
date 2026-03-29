import assert from "node:assert/strict";
import test from "node:test";

import { compactBridgeEventQueue } from "../src/controller/bridgeEvents.js";
import { createRequestDeduper } from "../src/controller/requestDeduper.js";
import { applyProjectEventDetailState, applyProjectEventListingState } from "../src/controller/projectStore.js";
import { arePropsEqualExceptFunctions } from "../src/shallowProps.js";
import { programSettingsEqual } from "../src/utils.js";

test("arePropsEqualExceptFunctions ignores callback identity churn", () => {
  assert.equal(
    arePropsEqualExceptFunctions(
      { value: 1, onClick: () => "left" },
      { value: 1, onClick: () => "right" },
    ),
    true,
  );
  assert.equal(
    arePropsEqualExceptFunctions(
      { value: 1, onClick: () => "left" },
      { value: 2, onClick: () => "left" },
    ),
    false,
  );
});

test("applyProjectEventListingState patches a matching project summary in place", () => {
  let nextProjects = null;
  let nextStats = null;
  const projects = [
    {
      repo_id: "repo-1",
      repo_path: "C:/demo",
      display_name: "Demo",
      status: "running:parallel",
      detail: "Branch main",
    },
  ];

  const result = applyProjectEventListingState({
    projects,
    project: {
      repo_id: "repo-1",
      project_dir: "C:/demo",
      status: "completed",
    },
    runningJob: [],
    setProjects(value) {
      nextProjects = value;
    },
    setWorkspaceStats(value) {
      nextStats = value;
    },
  });

  assert.ok(Array.isArray(result));
  assert.equal(result[0].status, "completed");
  assert.equal(nextProjects[0].status, "completed");
  assert.ok(nextStats);
});

test("programSettingsEqual compares normalized dashboard visibility without stringify churn", () => {
  assert.equal(
    programSettingsEqual(
      {
        model_provider: "openai",
        dashboard_visibility: {
          status: true,
          rate_limits: true,
        },
      },
      {
        model_provider: "openai",
        dashboard_visibility: {
          status: true,
          rate_limit_window_5h: true,
          rate_limit_window_7d: true,
          rate_limit_codex_spark: true,
        },
      },
    ),
    true,
  );
  assert.equal(
    programSettingsEqual(
      { model_provider: "openai", background_concurrency_limit: 2 },
      { model_provider: "openai", background_concurrency_limit: 4 },
    ),
    false,
  );
});

test("createRequestDeduper reuses identical in-flight requests", async () => {
  const deduper = createRequestDeduper();
  let invocationCount = 0;
  const loader = async () => {
    invocationCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true };
  };

  const [left, right] = await Promise.all([
    deduper.run("repo|core", loader),
    deduper.run("repo|core", loader),
  ]);

  assert.deepEqual(left, { ok: true });
  assert.deepEqual(right, { ok: true });
  assert.equal(invocationCount, 1);
  assert.equal(deduper.size(), 0);
});

test("applyProjectEventDetailState patches selected detail without a refetch", () => {
  const detail = {
    project: {
      repo_id: "repo-1",
      repo_path: "C:/demo",
      current_status: "running:parallel",
    },
    snapshot: {
      project: {
        repo_id: "repo-1",
        repo_path: "C:/demo",
        current_status: "running:parallel",
      },
    },
  };

  const result = applyProjectEventDetailState(detail, {
    repo_id: "repo-1",
    project_dir: "C:/demo",
    status: "completed",
  });

  assert.equal(result.project.current_status, "completed");
  assert.equal(result.snapshot.project.current_status, "completed");
  assert.equal(result.project.repo_path, "C:/demo");
});

test("compactBridgeEventQueue keeps the newest project event per repo while preserving jobs", () => {
  const queue = compactBridgeEventQueue([
    { event: "project.changed", payload: { repo_id: "repo-1", status: "running" } },
    { event: "job.updated", payload: { job: { id: "job-1", status: "running" } } },
    { event: "project.changed", payload: { repo_id: "repo-1", status: "completed" } },
    { event: "project.ui_event", payload: { repo_id: "repo-1", status: "completed" } },
    { event: "project.ui_event", payload: { repo_id: "repo-1", status: "failed" } },
  ]);

  assert.equal(queue.length, 3);
  assert.equal(queue[0].payload.status, "completed");
  assert.equal(queue[1].payload.job.id, "job-1");
  assert.equal(queue[2].payload.status, "failed");
});
