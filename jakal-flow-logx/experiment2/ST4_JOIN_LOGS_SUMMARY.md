# ST4 Join Node Logs Summary

Current time basis: 2026-03-31 20:16 KST

## Incident

The plan generation job failed because `ST4 (block B1)` was classified as a join node, but it did not have at least two prior dependencies.

## Related Logs

### 1) Job scheduler event

- File: `C:\Users\alber\.jakal-flow-workspace\job_scheduler_events.jsonl`
- Timestamp: `2026-03-31T11:16:06+00:00`

```text
{"event_type":"job-failed","job":{"command":"generate-plan","completed_at":"2026-03-31T11:16:06+00:00","created_at":"2026-03-31T11:13:07+00:00","display_name":"experiment2","error":"ST4 (block B1) must depend on at least two prior steps to act as a join node.","id":"job-generate-plan-1774955587631-1","job_lane":"execution","project_dir":"c:\\users\\alber\\github\\experiment2","started_at":"2026-03-31T11:13:07+00:00","status":"failed","updated_at_ms":1774955766409,"workspace_root":"C:\\Users\\alber\\.jakal-flow-workspace"},"timestamp":"2026-03-31T11:16:06+00:00"}
```

### 2) UI bridge crash log

- File: `C:\Users\alber\.jakal-flow-workspace\projects\experiment2-main-eb9f0de6c1\reports\20260331111606_ui-bridge_generate-plan.crash.log`
- Timestamp: `2026-03-31T11:16:06+00:00`

```text
exception_type: ValueError
exception_message: ST4 (block B1) must depend on at least two prior steps to act as a join node.
...
File "\\?\C:\Users\alber\GitHub\codex_auto\src\jakal_flow\orchestrator.py", line 1215, in _validate_hybrid_execution_steps
    raise ValueError(f"{step_label} must depend on at least two prior steps to act as a join node.")
ValueError: ST4 (block B1) must depend on at least two prior steps to act as a join node.
```

### 3) Bridge server crash log

- File: `C:\Users\alber\.jakal-flow-workspace\crash_logs\20260331111606_bridge-server_generate-plan.crash.log`
- Timestamp: `2026-03-31T11:16:06+00:00`

```text
exception_type: ValueError
exception_message: ST4 (block B1) must depend on at least two prior steps to act as a join node.
...
File "\\?\C:\Users\alber\GitHub\codex_auto\src\jakal_flow\orchestrator.py", line 1215, in _validate_hybrid_execution_steps
    raise ValueError(f"{step_label} must depend on at least two prior steps to act as a join node.")
ValueError: ST4 (block B1) must depend on at least two prior steps to act as a join node.
```

## Why It Happened

The planner runtime treats a step as `join` when its metadata marks it as a synchronization checkpoint. That join path requires at least two direct dependencies plus matching `merge_from` targets. `ST4` did not satisfy that requirement, so plan validation failed before the plan could be saved.

## Supporting Evidence

- `ST4` was reported as `block B1` in the error message.
- The failure occurred during execution-plan normalization and validation, before any saved `EXECUTION_PLAN.json` was produced for that run.

