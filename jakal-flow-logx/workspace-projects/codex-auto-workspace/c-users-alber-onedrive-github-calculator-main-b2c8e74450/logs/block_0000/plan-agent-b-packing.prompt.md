/fast

You are Planner Agent B for the local project at C:\Users\alber\OneDrive\문서\GitHub\calculator.
Follow any AGENTS.md rules in the repository.

Planner Agent A has already produced an intermediate decomposition artifact.
Your job is to convert that artifact into the final execution DAG.

Break the user's request into small execution checkpoints.
Use Planner Agent A's decomposition as the primary intermediate artifact, then regroup those ideas into a DAG execution tree where each node has one clear, locally judgeable completion condition.
Each node may contain multiple small sub-steps if they belong to the same clear outcome.
If a node would contain multiple independently judgeable outcomes, split it into multiple nodes.

Prefer narrow, dependency-aware blocks that Codex can realistically complete in one focused pass.
Do not combine unrelated work into the same node.
Do not require concrete test commands at planning time.
At this stage, define nodes by clear success conditions rather than by existing test commands.
Optimize the plan for a fully runnable and maintainable prototype.
Prefer implementation choices that are simple but not obviously disposable if the project continues.
If the requested outcome cannot be completed reliably without setup, integration, validation, cleanup, or supporting implementation work that the user did not explicitly mention, include that work in the plan.
Treat only directly necessary supporting work as in scope; do not add speculative roadmap items or optional expansion beyond the requested prototype outcome.
Use the following priority order while planning:
1. Follow AGENTS.md and explicit repository constraints first.
2. Use the user request as the primary product goal within those constraints.
3. Use src/jakal_flow/docs/REFERENCE_GUIDE.md for unstated implementation preferences and tie-breakers.
4. Use README.md and other repository docs to align with the existing structure.
5. Fall back to generic defaults only if the repository sources above do not decide the issue.

Requested execution mode:
parallel

The app is currently in parallel mode. Plan a DAG execution tree instead of a simple list.
Use `step_id` and `depends_on` to define the graph.
Only let steps become parallel-ready when their dependencies are complete.
Maximize safe frontier width. Prefer plans that create at least one credible parallel-ready wave with 2 or more steps after any required prerequisite setup.
Unless Agent A identifies a real safety blocker, convert its parallelizable groups into at least one concrete 2+ step ready wave.
For any steps that may run in parallel, provide non-empty `owned_paths` and make them as narrow as possible.
Prefer exact files or leaf directories over broad package roots so the scheduler can batch more work safely.
Keep exact-path ownership exclusive across the same ready wave.
If a wide fan-out needs one small contract-freezing or coordination step first, add that narrow prerequisite instead of collapsing the whole plan back to serial.
Do not put risky, tightly coupled, shared-contract, or same-file refactors in the same parallel-ready wave.
If a step needs broad repo-wide edits or merge-sensitive refactors, keep it isolated rather than pretending it is parallel-safe.
Do not include the final closeout sweep inside the normal task list. The app runs a separate closeout block after all planned tasks finish.

Return exactly one JSON object with a top-level "tasks" array containing 3 to 8 items.

JSON shape:
{
  "title": "short project name",
  "summary": "one short paragraph",
  "tasks": [
    {
      "step_id": "stable id like ST1",
      "task_title": "short stage name",
      "display_description": "one sentence or less for UI display",
      "codex_description": "one paragraph or less with the actual execution instruction for Codex",
      "reasoning_effort": "one of low, medium, high, xhigh based on expected difficulty",
      "depends_on": ["step ids that must complete first"],
      "owned_paths": ["repo-relative paths or directories this step primarily owns"],
      "success_criteria": "clear completion condition that can be judged locally",
      "metadata": {
        "candidate_block_id": "Planner Agent A block id",
        "parallelizable_after": ["Planner Agent A block ids or contract names carried through"],
        "implementation_notes": "non-docstring planning note carried forward from Planner Agent A",
        "is_skeleton_contract": false,
        "skeleton_contract_docstring": "required only when this step is the skeleton/bootstrap contract step; otherwise empty string",
        "candidate_owned_paths": ["Planner Agent A ownership hint for post-processing and traceability"]
      }
    }
  ]
}

Field requirements:

- "title": short and concise title for project.
- "summary": a short paragraph explaining the overall execution flow from a project perspective. It must briefly describe the role of each task in the broader project, not just restate the user request.
- "step_id": use stable ids like `ST1`, `ST2`, `ST3` so dependency references stay unambiguous.
- "task_title": short and actionable title for task.
- "display_description": very short user-facing explanation, no more than one sentence.
- "codex_description": the actual instruction for Codex, no more than one paragraph, specific enough to execute.
- "reasoning_effort": choose only `low`, `medium`, `high`, or `xhigh`. Use `low` for narrow mechanical edits, `medium` for normal implementation, `high` for multi-file or tricky work, and `xhigh` only for the hardest investigations or refactors.
- "depends_on": in parallel mode, use this to encode the DAG.
- "owned_paths": in parallel mode, list the main repo-relative files or directories each step owns so independently ready steps can be batched safely. Prefer narrow exact files or leaf directories. Use an empty array only when the step should run alone.
- "success_criteria": a concrete, locally judgeable done condition, describing what must be true when the block is complete.
- "metadata": carry Planner Agent A traceability hints. Preserve `candidate_block_id`, carry `parallelizable_after`, keep non-skeleton notes in `implementation_notes`, and use `skeleton_contract_docstring` only for the skeleton/bootstrap contract step.
- If the step is the skeleton/bootstrap contract step, make `codex_description` explicitly tell the executor to write the skeleton code with the provided docstring.

Do not include markdown fences or commentary outside the JSON.

Repository summary:
README:
# calculator

AGENTS:
AGENTS.md not found.

Reference notes (src/jakal_flow/docs/REFERENCE_GUIDE.md):
# Reference Guide

Use this document when the user prompt leaves implementation details unspecified and the repository needs a default direction.

The user prompt always takes priority.
If this guide conflicts with the user prompt, follow the prompt instead.
This guide defines baseline implementation principles. It is not an expansion-ideas document.

## 1. Roles and Priority

- Use this guide to fill in missing implementation detail when the prompt does not specify it.
- Treat the user prompt as the highest-priority instruction.
- Do not follow this guide when it conflicts with the prompt.
- Use this guide as a default implementation standard, not as a source of speculative feature ideas.

## 2. Prototype Standards

- A prototype is not just a script that happens to run.
- Even a minimal prototype should be runnable, maintainable, and extensible.
- Prefer the smallest sustainable implementation over the fastest possible shortcut.
- Do not make obviously disposable structure the default choice.

## 3. Technology Selection

- When the stack is not specified, choose based on a balance of simplicity, maintainability, and extensibility.
- Respect the existing stack, but do not use stack consistency alone to justify a poor-quality decision.
- Add new tools or dependencies only when they provide a clear practical benefit.
- Do not choose an approach only because it is the easiest thing to implement immediately.
- For this repository, prefer the existing `React + Tauri + JavaScri...

Docs:
No markdown files under repo/docs.

Planner Agent A decomposition artifact:
{
  "title": "high-precision-scientific-calculator",
  "strategy_summary": "This is a greenfield build, so the safest parallel strategy is to freeze a small computation-and-persistence contract layer first, then fan out into narrow feature slices around a React + Tauri + TypeScript application. The highest-value split is: product shell and persisted workspace, expression/precision engine, matrix engine, then solver and numerical tools on top of the expression engine, followed by a short integration and documentation pass.",
  "shared_contracts": [
    "Versioned `CalculatorSettings` schema covering display precision, internal precision mode, solver tolerance, max iterations, angle mode, and display mode, with persistence rules fixed early.",
    "A `NumericBackend` interface shared by expression, matrix, solver, and numerical tools so float and high-precision decimal modes can be swapped without UI-aware branching.",
    "A typed expression pipeline contract: tokenizer output, AST node shapes, validation diagnostics, compiled expression handle, and evaluation context including variables, constants, backend, and angle mode.",
    "A common `ComputationResult` and `Diagnostic` envelope for success, warnings, formatted output, convergence metadata, and recoverable numerical limitations.",
    "Versioned persistence schemas for history, memory registers, and restored workspace/session state, including timestamps and mode metadata.",
    "Feature service boundaries: UI calls pure engine/service modules; engine modules do not import React, persistence, or Tauri APIs."
  ],
  "skeleton_step": {
    "block_id": "SK1",
    "needed": true,
    "task_title": "Scaffold app shell and freeze computation contracts",
    "purpose": "A narrow bootstrap step reduces merge risk by fixing the package/tooling layout, the shared contracts every engine depends on, the persistence schema, and the feature folder boundaries before parallel implementation begins.",
    "contract_docstring": "Shared computation contracts for the calculator. All feature UIs talk only to typed service interfaces defined here. Expression, matrix, solver, and numerical-analysis engines must remain pure modules with no React, persistence, or Tauri imports. Persisted settings and workspace state flow only through versioned schemas. New feature code may depend on settings, numeric backend, and result envelopes, but must not reach into sibling engine internals.",
    "candidate_owned_paths": [
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
      "vitest.config.ts",
      "src-tauri",
      "src/app",
      "src/core/contracts",
      "src/persistence/schema.ts"
    ],
    "success_criteria": "The project boots with the chosen stack, shared types and stub service interfaces compile, the tab/mode shell exists, test tooling runs, and downstream work can proceed without redefining settings, result shapes, or engine boundaries."
  },
  "candidate_blocks": [
    {
      "block_id": "B1",
      "goal": "Deliver the product shell, persisted settings, memory, and history workspace",
      "work_items": [
        "Implement the mode-based desktop UI shell with tabs for Calculate, Matrix, Solver, Numerical Tools, and History/Settings",
        "Build settings panels for precision, tolerance, angle mode, iteration limits, and display formatting",
        "Implement persistent history records with expression, result, timestamp, and mode metadata",
        "Implement persistent memory registers (`MC`, `MR`, `M+`, `M-`, `MS`) and workspace restoration",
        "Wire keyboard input, result display components, and shared error/warning presentation"
      ],
      "implementation_notes": "This block should own the application frame and all persistence-facing state management, but it should call engine services only through frozen contracts. The UI should be product-oriented rather than keypad-emulation oriented, with discoverable settings and reusable panels for diagnostics and formatted output. Persisted state should be versioned from the start so precision settings and history survive future schema changes.",
      "testable_boundary": "The app launches, tab navigation works, settings persist across restart, history and memory operations survive restart, and shared result/error presentation is available to feature tabs.",
      "candidate_owned_paths": [
        "src/app",
        "src/features/settings",
        "src/features/history",
        "src/features/memory",
        "src/persistence"
      ],
      "parallelizable_after": [
        "SK1",
        "CalculatorSettings schema",
        "ComputationResult envelope",
        "persistence schemas"
      ],
      "parallel_notes": "This can run in parallel with engine work once the shared schemas exist. Avoid letting this block own engine internals or broad `src/core` paths."
    },
    {
      "block_id": "B2",
      "goal": "Implement the expression compiler, evaluator, and configurable precision backends",
      "work_items": [
        "Build tokenizer support for operators, parentheses, unary minus, identifiers, commas, and scientific notation",
        "Implement AST parsing with validation and clear syntax diagnostics",
        "Implement a compiled evaluator with constants, function library, and configurable angle mode",
        "Provide at least two numeric modes through the shared backend interface: standard float and high-precision decimal",
        "Implement result formatting for normal, scientific, and engineering notation where supported",
        "Add focused tests for parser correctness, evaluation correctness, angle behavior, near-cancellation, and small/large magnitude cases"
      ],
      "implementation_notes": "Parser, AST, validation, and evaluation should remain separate modules so repeated evaluation can reuse compiled expressions. The backend abstraction should cover arithmetic, elementary functions, comparisons, formatting, and tolerance-aware checks, with explicit notes where high-precision transcendentals fall back to approximations. This block should also establish the calculation-mode service consumed by the Calculate tab.",
      "testable_boundary": "Complex expressions evaluate correctly under both precision modes, angle mode changes trig behavior, invalid expressions return structured diagnostics, and numerical formatting respects display settings.",
      "candidate_owned_paths": [
        "src/core/expression",
        "src/core/precision",
        "src/features/calculate",
        "tests/expression",
        "tests/precision"
      ],
      "parallelizable_after": [
        "SK1",
        "NumericBackend interface",
        "expression pipeline contract"
      ],
      "parallel_notes": "This is a broad technical root for solver and numerical-analysis work, so keep ownership inside expression and precision folders only. It can run alongside B1 and B3 after the bootstrap contract freeze."
    },
    {
      "block_id": "B3",
      "goal": "Implement the matrix engine and matrix mode UI with stable linear algebra operations",
      "work_items": [
        "Implement matrix parsing/input state for practical sizes from 2x2 through 6x6",
        "Implement addition, subtraction, multiplication, and transpose",
        "Implement determinant, inverse, and linear solve `Ax=b` with partial pivoting",
        "Add singularity and dimension validation with clear diagnostics",
        "Expose matrix actions and result views in a dedicated Matrix tab",
        "Add tests for stable solves, determinant/inverse correctness, and singular or ill-conditioned edge cases"
      ],
      "implementation_notes": "The matrix engine should stay separate from the expression parser and use the shared numeric backend contract where feasible so precision mode remains coherent. Gaussian elimination with partial pivoting is the minimum stable path; LU decomposition is acceptable if it cleanly supports determinant and solve reuse....

User request:
Build a serious high-precision engineering/scientific calculator application focused on fast, accurate numerical computation, advanced math capability, usable product-quality UI, and configurable precision.

This is NOT a toy calculator and NOT a firmware emulator.
It should feel like a real computational tool for demanding technical users.

The product goal is:
- very fast and accurate numerical computation
- practical advanced scientific/engineering features
- configurable precision and numerical tolerance
- polished, usable UI
- coherent internal architecture
- meaningful automated tests

This is a 5-day-class software project, so prioritize depth and numerical quality over excessive feature count.

## Product direction

Think of this as a “high-performance scientific computation calculator” rather than a basic graphing calculator.

It should support advanced expression evaluation, matrix and linear algebra operations, numerical solving, controlled precision, and good UX.

Feature count may be reduced slightly in order to preserve:
- strong numerical correctness
- efficient algorithms where practical
- clean architecture
- product-level usability

---

## Core feature set

### 1. Advanced calculation mode

Implement a real expression parser and evaluator.

Support:
- `+`, `-`, `*`, `/`, `^`
- parentheses
- unary minus
- scientific notation like `1.2e-12`
- constants:
  - `pi`
  - `e`
- scientific functions:
  - `sin`, `cos`, `tan`
  - `asin`, `acos`, `atan`
  - `sinh`, `cosh`, `tanh`
  - `exp`, `log`, `ln`, `log10`
  - `sqrt`, `cbrt`
  - `abs`, `floor`, `ceil`, `round`
- optional but preferred if cleanly implemented:
  - gamma
  - erf
  - Bessel-related support or at least a structured extension path

Requirements:
- full expression input must work
- examples:
  - `sin(pi/3)^2 + cos(pi/3)^2`
  - `exp(-25) * cos(1000)`
  - `sqrt(2)^2 - 2`
- do NOT use unsafe raw eval as the main engine
- parser, AST, validation, and evaluation should be clearly separated

---

### 2. Precision, tolerance, and numerical settings

This is a core requirement.

Support user-configurable settings for:
- displayed precision
- internal precision mode
- solver tolerance
- max iterations for iterative algorithms
- angle mode: degree / radian
- display mode:
  - normal
  - scientific
  - engineering notation if practical

Requirements:
- user must be able to choose precision / tolerance from the UI
- internal numerical settings must actually affect computation where relevant
- precision settings must persist across restarts

Strong preference:
- support at least two computation backends or modes, for example:
  - standard floating-point mode
  - high-precision decimal mode
or an equivalent clean precision strategy

---

### 3. Linear algebra / matrix mode

Implement a strong matrix mode, because advanced scientific users need it more than superficial extra modes.

Support:
- matrix input UI
- at least 2x2 through 6x6 practical support
- addition
- subtraction
- multiplication
- transpose
- determinant
- inverse
- solve linear system `Ax=b`

Strong preference:
- include one or more of:
  - LU decomposition
  - Gaussian elimination with partial pivoting
  - QR decomposition if practical
  - condition-related diagnostics where practical

Requirements:
- prioritize numerical stability
- dimension validation and singular-matrix handling must be clear
- matrix engine must be separate from the general parser/evaluator

---

### 4. Numerical solver mode

Implement one-variable and preferably small-system numerical solving.

Minimum required:
- one-variable root finding
- support:
  - Newton-Raphson
  - bisection
- allow:
  - initial guess
  - interval bounds where appropriate
- show convergence result or failure clearly

Preferred additions if practical:
- secant method
- finite-difference derivative fallback
- simple nonlinear system solving for 2 variables

Requirements:
- tolerance and max iteration settings must be respected
- poor convergence and invalid intervals must be handled clearly
- solver engine must be separate from UI code

Examples:
- `x^3 - x - 2 = 0`
- `cos(x) - x = 0`
- difficult cases should not silently fail

---

### 5. Numerical analysis utilities

Include a small but serious set of numerical-analysis tools.

Choose a focused subset that you can implement well.

Required:
- numerical differentiation at a point
- numerical integration on an interval

Preferred methods:
- differentiation:
  - central difference
  - adaptive or improved finite difference if practical
- integration:
  - trapezoidal
  - Simpson’s rule
  - adaptive Simpson if practical

Requirements:
- expose method choice where relevant
- respect precision / tolerance settings
- show warnings when results may be unreliable

---

### 6. Expression history, memory, and reusable workspace

Support:
- `MC`, `MR`, `M+`, `M-`, `MS`
- persistent calculation history
- each history record should include:
  - expression
  - result
  - timestamp
  - mode used if relevant
- ability to reuse prior expressions

Preferred:
- named variables such as:
  - `a = 3.14`
  - `b = sqrt(2)`
  - later use `a*b`
if this can be implemented cleanly

Requirements:
- history and memory must persist across restarts
- state restoration must be reliable

---

## Optional feature with limited scope

Only include graphing if it is lightweight and does not harm core numerical quality.

If included, keep it narrow:
- single-function or few-function plotting
- zoom and trace only
- no need for a huge graphing subsystem

Graphing is secondary.
Numerical quality, matrix/solver capability, and precision control are primary.

---

## UI / UX requirements

The UI must feel like a real product.

Requirements:
- clean tabbed or mode-based layout
- likely modes:
  - Calculate
  - Matrix
  - Solver
  - Numerical Tools
  - History / Settings
- keyboard input must work well
- settings must be easy to discover
- error messages must be understandable
- result display must support:
  - configurable precision
  - scientific formatting
  - engineering formatting if implemented
- matrix input and solver input must be reasonably usable
- app should feel polished, not like a raw developer tool

Do not waste effort replicating physical calculator hardware aesthetics.
Prefer a clean technical desktop/web app.

---

## Performance and algorithm quality requirements

This is central to the project.

Use efficient and numerically sensible algorithms where practical.

Examples of acceptable focus:
- partial pivoting in elimination
- stable root-finding choices
- method selection based on problem type
- avoiding unnecessary recomputation
- structured caching where safe and useful
- separating parse/compile/evaluate steps so repeated calculations can be faster

Do not add fake “optimization” complexity just for show.
Prefer real, practical algorithmic quality.

The application should explicitly aim for:
- fast repeated evaluation
- accurate results
- robust handling of numerically awkward inputs
- clarity about limitations

---

## Architecture requirements

Separate concerns properly.

At minimum:
- parser / tokenizer / AST
- evaluator / numerical backend
- matrix / linear algebra engine
- solver engine
- numerical-analysis engine
- persistence layer
- UI state and components

Avoid a giant monolithic file.
The structure should be maintainable and extensible.

---

## Testing requirements

Add meaningful automated tests.

At minimum include tests for:
- parser correctness
- expression evaluation correctness
- angle mode behavior
- precision / tolerance behavior
- matrix operations
- linear system solving
- root finding success and failure cases
- numerical integration / differentiation
- persistence logic where practical

Include some tests with numerically sensitive cases:
- near-cancellation
- very small / very large values
- singular or ill-conditioned matrix cases where practical
- non-convergent solver scenarios

The tests should verify real numerical behavior, not only smoke checks.

---

## README requirements

Provide a clear README that includes:
- product overview
- setup instructions
- run instructions
- test instructions
- feature summary
- architecture summary
- numerical methods used
- precision model and limitations
- non-goals

---

## Explicit non-goals

Do NOT implement:
- full Casio firmware emulation
- exam mode
- USB/file transfer workflows
- add-in/plugin system
- symbolic CAS
- a huge graphing platform
- every advanced special function in mathematics
- massive spreadsheet/statistics subsystems

This project should be a strong, focused, high-precision computational calculator product.

---

## Quality bar

The final result must be:
- runnable
- coherent
- numerically serious
- reasonably fast
- product-like in UX
- backed by meaningful tests

Prioritize:
1. correctness
2. numerical robustness
3. precision configurability
4. performance
5. usability

If tradeoffs are necessary, cut peripheral features before sacrificing core numerical quality.
