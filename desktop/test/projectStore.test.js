import assert from "node:assert/strict";
import test from "node:test";

import { applyProjectDetailListingState } from "../src/controller/projectStore.js";

test("applyProjectDetailListingState merges refreshed detail into the existing project row", () => {
  let nextProjects = null;
  let nextWorkspaceStats = null;

  const nextListing = applyProjectDetailListingState({
    projects: [
      {
        repo_id: "demo",
        slug: "demo",
        display_name: "Demo",
        repo_path: "/repo",
        origin_url: "",
        branch: "main",
        status: "plan_ready",
        detail: "Branch main",
        created_at: "2026-03-27T00:00:00+00:00",
        last_run_at: "2026-03-27T00:00:00+00:00",
        summary: "Old summary",
        progress: "Old progress",
        stats: {
          total_steps: 2,
          completed_steps: 0,
          failed_steps: 0,
          running_steps: 0,
          remaining_steps: 2,
        },
        closeout_status: "not_started",
      },
    ],
    detail: {
      project: {
        repo_id: "demo",
        slug: "demo",
        display_name: "Demo",
        repo_path: "/repo",
        origin_url: "https://github.com/example/demo",
        branch: "main",
        current_status: "running:block:2",
        created_at: "2026-03-27T00:00:00+00:00",
        last_run_at: "2026-03-27T01:00:00+00:00",
      },
      summary: "New summary",
      progress: "Completed 1/2 steps, next: ST2",
      stats: {
        total_steps: 2,
        completed_steps: 1,
        failed_steps: 0,
        running_steps: 1,
        remaining_steps: 1,
      },
      plan: {
        closeout_status: "not_started",
      },
    },
    runningJob: {
      id: "job-1",
      status: "running",
    },
    setProjects: (projects) => {
      nextProjects = projects;
    },
    setWorkspaceStats: (stats) => {
      nextWorkspaceStats = stats;
    },
  });

  assert.deepEqual(nextListing, nextProjects);
  assert.equal(nextProjects.length, 1);
  assert.deepEqual(nextProjects[0], {
    repo_id: "demo",
    slug: "demo",
    display_name: "Demo",
    repo_path: "/repo",
    origin_url: "https://github.com/example/demo",
    branch: "main",
    status: "running:block:2",
    detail: "https://github.com/example/demo",
    created_at: "2026-03-27T00:00:00+00:00",
    last_run_at: "2026-03-27T01:00:00+00:00",
    summary: "New summary",
    progress: "Completed 1/2 steps, next: ST2",
    stats: {
      total_steps: 2,
      completed_steps: 1,
      failed_steps: 0,
      running_steps: 1,
      remaining_steps: 1,
    },
    closeout_status: "not_started",
  });
  assert.deepEqual(nextWorkspaceStats, {
    project_count: 1,
    ready_like: 0,
    running: 1,
    failed: 0,
  });
});
