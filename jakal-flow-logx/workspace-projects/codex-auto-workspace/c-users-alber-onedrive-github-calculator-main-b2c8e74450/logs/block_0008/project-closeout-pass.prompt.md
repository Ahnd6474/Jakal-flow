/fast

You are performing final closeout for the managed repository at C:\Users\alber\OneDrive\문서\GitHub\calculator.
Follow any AGENTS.md rules in the repository.
All planned execution tasks are already marked complete. This pass is for final cleanup and handoff quality only.
Managed planning documents live outside the repo at C:\Users\alber\OneDrive\문서\GitHub\codex_auto\.codex-auto-workspace\projects\c-users-alber-onedrive-github-calculator-main-b2c8e74450\docs.
Primary verification command: python -m pytest.

Project title:
precision-scientific-calculator

Original user request:
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

Execution summary:
Start by scaffolding a React + Tauri + TypeScript calculator shell and freezing the shared computation, settings, and persistence contracts so feature work can proceed safely in parallel. Then build three independent slices in parallel: the product shell with persisted settings/history/memory, the expression and precision engine for calculation mode, and the matrix engine with its own UI. Once the expression core and shell exist, add the solver and numerical tools as separate feature slices, then finish by wiring all slices into one runnable app and documenting the architecture, numerical methods, and precision model.

Completed tasks:
- ST1: Scaffold contracts and app skeleton :: The project boots into a minimal Tauri/React shell, shared computation and persistence contract modules compile, versioned settings/workspace schemas exist, and stub interfaces for calculate, matrix, solver, and numerical tools are present without cross-layer leaks.
- ST2: Build shell, settings, and persistence workspace :: Tab navigation works, settings for precision/tolerance/angle/display modes persist across restart, memory and history survive restart with timestamps and mode metadata, workspace restoration is reliable, and persistence logic has focused automated coverage.
- ST3: Implement expression engine and precision modes :: Complex expressions evaluate correctly under both precision modes, invalid expressions return structured diagnostics, display formatting honors settings, angle mode changes trig behavior correctly, and automated tests cover parser/evaluator correctness plus small/large and near-cancellation cases.
- ST4: Implement matrix engine and matrix mode :: Matrix mode supports input and operations for practical matrix sizes, linear solve uses partial pivoting or an equivalent stable method, singular or dimension errors are explicit, and tests verify determinant, inverse, solve, and edge-case behavior.
- ST5: Add numerical solver mode :: Users can solve one-variable equations with initial guesses and interval bounds where appropriate, tolerance and max iterations are respected, invalid intervals and poor convergence are reported clearly, and tests cover success, failure, and non-convergent scenarios.
- ST6: Add numerical analysis tools :: Numerical tools support differentiation and integration with selectable methods, respect relevant settings and tolerances, surface warnings when estimates may be unreliable, and tests cover representative accurate and failure-prone numerical cases.
- ST7: Integrate product flow and project docs :: The app presents all planned modes in one coherent flow, shared settings and result presentation work consistently across features, any required integration tests or smoke validations are in place, and the README fully documents usage, architecture, numerical methods, precision limits, and non-goals.

Repository summary:
README:
# Precision Scientific Calculator

A Vite + React + TypeScript calculator shell with a Tauri desktop wrapper. The app is aimed at practical engineering/scientific work: parsed expression evaluation, matrix operations, scalar root solving, numerical differentiation/integration, configurable precision settings, and persistent workspace state.

This is a real-valued numerical tool, not a symbolic CAS and not a firmware emulator.

## What It Does

- Evaluates parsed expressions with `+`, `-`, `*`, `/`, `^`, parentheses, unary signs, and scientific notation.
- Supports constants `pi` and `e`.
- Supports functions `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `exp`, `ln`, `log10`, `log`, `sqrt`, `cbrt`, `abs`, `floor`, `ceil`, and `round`.
- Runs with two numeric backends: `float64` and `decimal`.
- Persists settings, active workspace mode, matrix drafts, history, and memory registers in versioned local storage documents.
- Provides four product modes inside one shell:
  - Expression Engine
  - Matrix Lab
  - Root Solver
  - Numerical Tools

## Run It

```bash
npm install
npm run dev
```

Desktop shell:

```bash
npm run tauri:dev
```

Production build:

```bash
npm run build
```

## Test It

Unit/integration tests:

```bash
npm run test:unit
```

Repository verification command:

```bash
python -m pytest
```

`python -m pytest` also checks the TypeScript typecheck and the Vitest suite from the repository root.

## Product Flow

All four modes live inside the same app shell in [`src/app/App.tsx`](./src/app/App.tsx).

- Shared numerical settings apply across expression, matrix, solver, and numerical-tool modes.
- The right-side result panel shows the active mode summary using the same presentation contract.
- Any mode can store the current presentation into persistent history or a memory register.
- Matrix drafts now participate in the shared shell flow, so matrix dimensions/values survive mode switches and matrix results can be captured in history...

AGENTS:
AGENTS.md not found.

Docs:
No markdown files under repo/docs.

Additional user instructions:
None.

Required closeout work:
1. Review the full repository and remove obvious dead code, redundant paths, duplicated logic, throwaway scaffolding, or low-value leftovers introduced during implementation when it is safe to do so.
2. Verify the user request is actually satisfied end-to-end and tighten rough edges where needed.
3. Run and/or improve executable tests so the repository remains in a coherent verified state.
4. If the project is realistically runnable on the local machine without heavy external infrastructure, run the most relevant local entrypoint or smoke check and fix small safe issues found there.
5. Remove obviously unnecessary generated or temporary directories left behind by implementation work when they are safe to delete and are not part of the product or test fixtures.
6. Write a concise future-maintainer guide and closeout summary to C:\Users\alber\OneDrive\문서\GitHub\codex_auto\.codex-auto-workspace\projects\c-users-alber-onedrive-github-calculator-main-b2c8e74450\docs\CLOSEOUT_REPORT.md. Include what was completed, how to continue later, important files, and remaining risks or follow-up ideas.
7. Update README or repository docs only when they match verified implementation.

Execution rules:
- Use one focused closeout pass.
- Prefer small safe cleanup over speculative refactors.
- Do not expand scope into new features.
- If a requested closeout item is not safely feasible, explain that clearly in C:\Users\alber\OneDrive\문서\GitHub\codex_auto\.codex-auto-workspace\projects\c-users-alber-onedrive-github-calculator-main-b2c8e74450\docs\CLOSEOUT_REPORT.md.
