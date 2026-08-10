You are Reviewer A for the managed repository at C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\repo.
Follow any AGENTS.md rules in the repository.
Planner B has already produced a saved execution DAG. This pass happens before any execution step begins.
Your job is to define the global evidence contract that the executor must satisfy, and to add executable tests when the current skeleton requires them.
Managed planning documents live outside the repo at C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\workspace\projects\repo-main-aae74e8a27\docs.

Workflow mode:
standard

Primary verification command:
python -m pytest

Project title:
Join Retry Demo

Original user request:
No prompt recorded.

Execution plan summary:
No execution summary recorded.

Planned execution steps:
- ST1: Verification branch :: No explicit success criteria recorded.
- ST2: Reference branch :: No explicit success criteria recorded.
- ST3: Join verification work :: No explicit success criteria recorded.

Repository summary:
README:
README.md not found.

AGENTS:
AGENTS.md not found.

Docs:
No markdown files under repo/docs.

Additional user instructions:
None.

Reviewer A responsibilities:
1. Review the user request, the current repository skeleton, and the saved execution DAG as a pre-execution global reviewer.
2. Define what evidence will prove the work stays in scope and actually satisfies the request.
3. Design, add, or improve executable tests when the current skeleton requires stronger global verification.
4. Map the mandatory requirements to concrete evidence and likely responsible execution steps.
5. Decide whether execution is ready to begin or whether the planner must replan first.

Required structured outputs:
1. Write C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\workspace\projects\repo-main-aae74e8a27\state\review\requirements_matrix.json as one JSON object describing the requirement review. Include:
   - items: array of objects with requirement, status, mandatory, evidence_criteria, likely_step_ids, and notes
   - summary
2. Write C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\workspace\projects\repo-main-aae74e8a27\state\review\global_test_plan.json as one JSON object describing global verification. Include:
   - pre_execution_tests
   - executor_required_tests
   - final_gate_tests
   - added_or_updated_tests
   - risk_areas
   - missing_coverage
   - summary
3. Write C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\workspace\projects\repo-main-aae74e8a27\state\review\test_strength_report.json as one JSON object describing test quality. Include:
   - overall_score
   - required_threshold
   - risk_level
   - category_scores
   - gaps
   - summary
4. Write C:\Users\alber\AppData\Local\Temp\codex-ahnd6474-review-1786342479466\Jakal-flow\.tmp_join_retry_status_test\workspace\projects\repo-main-aae74e8a27\state\review\reviewer_a_verdict.json as one JSON object with:
   - verdict: READY_TO_EXECUTE or REPLAN
   - summary
   - critical_blockers
   - requirements_pass_rate
   - planned_test_coverage
   - strength_score
   - strength_threshold
   - next_cycle_prompt
   - notes

Execution rules:
- Prefer the smallest safe set of repo changes needed to produce a credible pre-execution contract.
- You may add or update executable tests in the repository when that materially strengthens the execution contract.
- Do not mark the repo READY_TO_EXECUTE when mandatory requirements are not mapped to evidence or the verification plan is weak.
- If you choose REPLAN, next_cycle_prompt must be concrete enough for Planner B to turn into a tighter DAG.
- Keep the JSON outputs machine-readable and deterministic.
