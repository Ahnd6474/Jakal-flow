/fast

You are working inside the managed repository at C:\Users\alber\OneDrive\문서\GitHub\calculator.
Follow any AGENTS.md rules in the repository.
Treat the saved execution plan as the current scope boundary unless the user explicitly updates it.
You are executing one node of a saved DAG execution tree.
Do not expand scope beyond the active task, dependency boundary, and scope guard.
Managed planning documents live outside the repo at C:\Users\alber\OneDrive\문서\GitHub\codex_auto\.codex-auto-workspace\projects\c-users-alber-onedrive-github-calculator-main-b2c8e74450\docs.
Verification command for this step: python -m pytest.

Current task:
- Title: Scaffold contracts and app skeleton
- UI description: Create the project skeleton and freeze shared contracts before feature work starts.
- Success criteria: The project boots into a minimal Tauri/React shell, shared computation and persistence contract modules compile, versioned settings/workspace schemas exist, and stub interfaces for calculate, matrix, solver, and numerical tools are present without cross-layer leaks.
- Depends on: none
- Owned paths:
- package.json
- tsconfig.json
- vite.config.ts
- vitest.config.ts
- src-tauri
- src/app
- src/core/contracts
- src/persistence/schema.ts

Codex execution instruction:
Scaffold the React + Tauri + TypeScript + Vitest application, establish the folder layout, and write the shared skeleton code with the provided docstring in the contract layer so all later steps implement against fixed service, settings, result, and persistence boundaries instead of redefining them. Write the skeleton code with this contract docstring in the appropriate module, class, or function: """Shared computation contracts for the calculator. All feature UIs talk only to typed service interfaces defined here. Expression, matrix, solver, and numerical-analysis engines must remain pure modules with no React, persistence, or Tauri imports. Persisted settings and workspace state flow only through versioned schemas. New feature code may depend on settings, numeric backend, and result envelopes, but must not reach into sibling engine internals."""

Memory context:
No strongly relevant prior memory found.

Plan snapshot:
# Execution Plan

- Repository: calculator
- Working directory: C:\Users\alber\OneDrive\문서\GitHub\calculator
- Source: https://github.com/Ahnd6474/calculator.git
- Branch: main
- Generated at: 2026-03-27T01:25:05+00:00

## Plan Title
precision-scientific-calculator

## User Prompt
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
- s...

Mid-term plan:
# Mid-Term Plan

This block follows the user-reviewed execution step.

- [ ] MT1 -> ST1: Scaffold contracts and app skeleton

Scope guard:
# Scope Guard

- Repository URL: https://github.com/Ahnd6474/calculator.git
- Branch: main
- Project slug: c-users-alber-onedrive-github-calculator-main-b2c8e74450

## Rules

1. Treat the saved project plan and reviewed execution steps as the current scope boundary unless the user explicitly changes them.
2. Mid-term planning must stay a strict subset of the saved plan.
3. Prefer small, reversible, test-backed changes.
4. Do not widen product scope automatically.
5. Only update README or docs to reflect verified repository state, and reserve README.md edits for planning-time alignment or the final closeout pass.
6. Roll back to the current safe revision when validation regresses.

Research notes:
# Research Notes

No research notes recorded yet.

Additional user instructions:
None.

Required workflow:
1. Inspect the relevant project files first so function names, module boundaries, and terminology stay consistent with the codebase.
2. Determine the smallest safe change set that satisfies the task instruction and success criteria.
3. Add or update executable tests that locally verify the task.
4. Implement the task in code.
5. Run the verification command and keep docs aligned only with verified behavior.
6. Do not edit README.md during normal execution steps. Reserve README updates for planning artifacts outside the repo or the final closeout pass unless the user explicitly says otherwise.
7. Record concise research or implementation notes in C:\Users\alber\OneDrive\문서\GitHub\codex_auto\.codex-auto-workspace\projects\c-users-alber-onedrive-github-calculator-main-b2c8e74450\docs\RESEARCH_NOTES.md when they materially help traceability.
8. If the task cannot be completed safely in one pass, explain why in docs/BLOCK_REVIEW.md instead of making speculative edits.

Execution rules:
- Treat the owned paths above as the primary write scope for this node.
- Avoid editing files that are primarily owned by other pending nodes unless a tiny compatibility adjustment is strictly required.
- Do not assume sibling nodes have already landed.
- If the task would require a broad cross-node refactor, stop and document the blocker instead of making merge-sensitive edits.
- Keep the change set merge-friendly, traceable, and limited.
- Leave repository-wide handoff docs like README.md alone during step execution.
- Use web search only when directly necessary for official documentation or narrowly scoped factual verification.
