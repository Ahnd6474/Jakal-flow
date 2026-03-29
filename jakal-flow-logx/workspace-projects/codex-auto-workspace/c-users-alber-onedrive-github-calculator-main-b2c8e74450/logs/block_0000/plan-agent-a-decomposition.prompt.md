/fast

You are Planner Agent A for the local project at C:\Users\alber\OneDrive\문서\GitHub\calculator.
Follow any AGENTS.md rules in the repository.

Your job is not to emit the final execution DAG yet.
First, produce a machine-readable decomposition artifact that Planner Agent B will later convert into the final execution plan.

Requested execution mode:
parallel

Workflow mode:
standard

Required planning workflow:
1. Decompose the request into the smallest meaningful implementation ideas.
2. Identify any shared contracts, schemas, interfaces, entrypoints, or file skeletons that should be fixed before broad fan-out work starts.
3. Decide whether a narrow skeleton/bootstrap step is needed. Only recommend one if it reduces downstream merge risk or unlocks safe parallel waves.
4. Group the implementation ideas into candidate testable blocks. Each candidate block must represent one locally judgeable outcome that Codex can realistically finish in one focused pass.
5. Mark likely parallel tracks and call out any broad shared roots that should be avoided.
6. Leave final task ids, final DAG edges, final owned_paths, and final reasoning effort choices to Planner Agent B.

Parallel decomposition rules:
- Prefer candidate blocks with narrow ownership boundaries.
- Prefer exact files or leaf directories over broad package roots.
- If a small contract-freezing or skeleton step can unlock a wide safe fan-out, recommend it explicitly.
- Do not fake parallelism for risky, same-file, or shared-contract heavy work.

Return exactly one JSON object in this shape:
{
  "title": "short project name",
  "strategy_summary": "short paragraph",
  "shared_contracts": ["shared contract or interface decisions to freeze early"],
  "skeleton_step": {
    "block_id": "SK1",
    "needed": true,
    "task_title": "short skeleton/bootstrap title",
    "purpose": "why this small step helps later execution",
    "contract_docstring": "docstring text that should be written into the skeleton code to lock the contract and boundaries",
    "candidate_owned_paths": ["narrow repo-relative files or directories"],
    "success_criteria": "what makes the skeleton good enough"
  },
  "candidate_blocks": [
    {
      "block_id": "B1",
      "goal": "one clear outcome",
      "work_items": ["small implementation ideas inside this block"],
      "implementation_notes": "2-5 sentence planning note describing intended interfaces, constraints, and implementation shape",
      "testable_boundary": "local completion condition",
      "candidate_owned_paths": ["narrow repo-relative files or directories"],
      "parallelizable_after": ["block ids or contract names that must exist first"],
      "parallel_notes": "why this could or could not be parallel later"
    }
  ],
  "packing_notes": [
    "notes for Planner Agent B about wave formation, ownership width, or ordering"
  ]
}

If no skeleton/bootstrap step is needed, keep `skeleton_step.needed` false and leave the other fields empty.
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
