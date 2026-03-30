import test from "node:test";
import assert from "node:assert/strict";

import {
  applyConfigRuntimeModelSelection,
  canEditStep,
  defaultModelForRuntime,
  failureReasonCode,
  failureReasonLabel,
  jobHasNewerActiveReplacement,
  selectedConfigReasoning,
} from "./utils.js";

test("jobHasNewerActiveReplacement detects a newer active job for the same project", () => {
  const jobs = [
    {
      id: "job-new",
      repo_id: "repo-1",
      project_dir: "C:/repo",
      status: "running",
      updated_at_ms: 200,
    },
    {
      id: "job-old",
      repo_id: "repo-1",
      project_dir: "C:/repo",
      status: "failed",
      updated_at_ms: 100,
    },
  ];

  assert.equal(jobHasNewerActiveReplacement(jobs[1], jobs), true);
});

test("jobHasNewerActiveReplacement ignores terminal jobs when no newer active replacement exists", () => {
  const jobs = [
    {
      id: "job-old",
      repo_id: "repo-1",
      project_dir: "C:/repo",
      status: "failed",
      updated_at_ms: 100,
    },
    {
      id: "job-other",
      repo_id: "repo-2",
      project_dir: "C:/other",
      status: "running",
      updated_at_ms: 300,
    },
  ];

  assert.equal(jobHasNewerActiveReplacement(jobs[0], jobs), false);
});

test("canEditStep allows editing failed steps when the run is idle", () => {
  assert.equal(
    canEditStep(
      {
        step_id: "ST2",
        status: "failed",
        metadata: {},
      },
      false,
    ),
    true,
  );
});

test("canEditStep still blocks failed steps while a run is active", () => {
  assert.equal(
    canEditStep(
      {
        step_id: "ST2",
        status: "failed",
        metadata: {},
      },
      true,
    ),
    false,
  );
});

test("failureReasonLabel maps step metadata reason codes to readable labels", () => {
  assert.equal(
    failureReasonLabel(
      {
        metadata: {
          failure_reason_code: "verification_test_failed",
        },
      },
      "en",
    ),
    "Verification tests failed",
  );
  assert.equal(
    failureReasonLabel(
      {
        metadata: {
          failure_reason_code: "verification_test_failed",
        },
      },
      "ko",
    ),
    "검증 테스트 실패",
  );
});

test("failureReasonCode reads both top-level and step metadata reason codes", () => {
  assert.equal(failureReasonCode({ failure_reason_code: "agent_pass_failed" }), "agent_pass_failed");
  assert.equal(failureReasonCode({ metadata: { failure_reason_code: "parallel_merge_conflict" } }), "parallel_merge_conflict");
});

test("defaultModelForRuntime skips auto catalog entries for openai providers", () => {
  const modelCatalog = [
    { model: "auto", display_name: "Auto", provider: "openai", hidden: false },
    { model: "gpt-5.4", display_name: "GPT-5.4", provider: "openai", hidden: false },
  ];

  assert.equal(defaultModelForRuntime(modelCatalog, { model_provider: "openai" }), "gpt-5.4");
});

test("applyConfigRuntimeModelSelection keeps a concrete model while supporting auto reasoning", () => {
  const modelCatalog = [
    {
      model: "gpt-5.4",
      display_name: "GPT-5.4",
      provider: "openai",
      hidden: false,
      default_reasoning_effort: "medium",
      supported_reasoning_efforts: ["low", "medium", "high", "xhigh"],
    },
  ];

  const nextRuntime = applyConfigRuntimeModelSelection(
    { model_provider: "openai", model: "gpt-5.4", model_slug_input: "gpt-5.4", effort: "medium" },
    modelCatalog,
    "gpt-5.4",
    "auto",
  );

  assert.equal(nextRuntime.model, "gpt-5.4");
  assert.equal(nextRuntime.model_slug_input, "gpt-5.4");
  assert.equal(nextRuntime.effort_selection_mode, "auto");
  assert.equal(selectedConfigReasoning(modelCatalog, nextRuntime), "auto");
});
