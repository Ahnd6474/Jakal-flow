# Execution Plan

- Repository: calculator
- Working directory: C:\Users\alber\OneDrive\문서\GitHub\calculator
- Source: https://github.com/Ahnd6474/calculator.git
- Branch: main
- Generated at: 2026-03-27T03:25:31+00:00

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

## Execution Summary
Start by scaffolding a React + Tauri + TypeScript calculator shell and freezing the shared computation, settings, and persistence contracts so feature work can proceed safely in parallel. Then build three independent slices in parallel: the product shell with persisted settings/history/memory, the expression and precision engine for calculation mode, and the matrix engine with its own UI. Once the expression core and shell exist, add the solver and numerical tools as separate feature slices, then finish by wiring all slices into one runnable app and documenting the architecture, numerical methods, and precision model.

## Workflow Mode
standard

## Execution Mode
parallel

## Planned Steps
- ST1: Scaffold contracts and app skeleton
  - UI description: Create the project skeleton and freeze shared contracts before feature work starts.
  - Codex instruction: Scaffold the React + Tauri + TypeScript + Vitest application, establish the folder layout, and write the shared skeleton code with the provided docstring in the contract layer so all later steps implement against fixed service, settings, result, and persistence boundaries instead of redefining them. Write the skeleton code with this contract docstring in the appropriate module, class, or function: """Shared computation contracts for the calculator. All feature UIs talk only to typed service interfaces defined here. Expression, matrix, solver, and numerical-analysis engines must remain pure modules with no React, persistence, or Tauri imports. Persisted settings and workspace state flow only through versioned schemas. New feature code may depend on settings, numeric backend, and result envelopes, but must not reach into sibling engine internals."""
  - GPT reasoning: high
  - Parallel group: none
  - Depends on: none
  - Owned paths: package.json, tsconfig.json, vite.config.ts, vitest.config.ts, src-tauri, src/app, src/core/contracts, src/persistence/schema.ts
  - Verification: python -m pytest
  - Success criteria: The project boots into a minimal Tauri/React shell, shared computation and persistence contract modules compile, versioned settings/workspace schemas exist, and stub interfaces for calculate, matrix, solver, and numerical tools are present without cross-layer leaks.
  - Metadata: {"candidate_block_id": "SK1", "candidate_owned_paths": ["package.json", "tsconfig.json", "vite.config.ts", "vitest.config.ts", "src-tauri", "src/app", "src/core/contracts", "src/persistence/schema.ts"], "implementation_notes": "A narrow bootstrap step reduces merge risk by fixing the package layout, shared contracts, persistence schema, and feature folder boundaries before parallel implementation begins.", "is_skeleton_contract": true, "parallelizable_after": [], "skeleton_contract_docstring": "Shared computation contracts for the calculator. All feature UIs talk only to typed service interfaces defined here. Expression, matrix, solver, and numerical-analysis engines must remain pure modules with no React, persistence, or Tauri imports. Persisted settings and workspace state flow only through versioned schemas. New feature code may depend on settings, numeric backend, and result envelopes, but must not reach into sibling engine internals."}
- ST2: Build shell, settings, and persistence workspace
  - UI description: Implement the product shell and persistent settings, history, memory, and workspace state.
  - Codex instruction: Build the mode-based UI shell with tabs and shared result/diagnostic presentation, then implement versioned persistence for calculator settings, history, memory registers, and restored workspace state so product navigation and state management are complete without depending on engine internals.
  - GPT reasoning: high
  - Parallel group: none
  - Depends on: ST1
  - Owned paths: src/app, src/features/settings, src/features/history, src/features/memory, src/persistence, src/components/results, tests/persistence
  - Verification: python -m pytest
  - Success criteria: Tab navigation works, settings for precision/tolerance/angle/display modes persist across restart, memory and history survive restart with timestamps and mode metadata, workspace restoration is reliable, and persistence logic has focused automated coverage.
  - Metadata: {"candidate_block_id": "B1", "candidate_owned_paths": ["src/app", "src/features/settings", "src/features/history", "src/features/memory", "src/persistence"], "implementation_notes": "Own the application frame and persistence-facing state management, keep the UI product-oriented rather than keypad-emulation oriented, and call engine services only through frozen contracts.", "is_skeleton_contract": false, "parallelizable_after": ["SK1", "CalculatorSettings schema", "ComputationResult envelope", "persistence schemas"], "skeleton_contract_docstring": ""}
- ST3: Implement expression engine and precision modes
  - UI description: Build the parser, evaluator, and configurable numeric backends for calculation mode.
  - Codex instruction: Implement the tokenizer, AST parser, validation diagnostics, compiled evaluator, function library, and at least two numeric modes through the shared backend interface, then expose calculation-mode service/UI pieces and tests for correctness, angle handling, formatting, and numerically sensitive cases.
  - GPT reasoning: high
  - Parallel group: none
  - Depends on: ST1
  - Owned paths: src/core/expression, src/core/precision, src/services/calculate, src/features/calculate, tests/expression, tests/precision
  - Verification: python -m pytest
  - Success criteria: Complex expressions evaluate correctly under both precision modes, invalid expressions return structured diagnostics, display formatting honors settings, angle mode changes trig behavior correctly, and automated tests cover parser/evaluator correctness plus small/large and near-cancellation cases.
  - Metadata: {"candidate_block_id": "B2", "candidate_owned_paths": ["src/core/expression", "src/core/precision", "src/features/calculate", "tests/expression", "tests/precision"], "implementation_notes": "Keep parser, AST, validation, and evaluation separate so compiled expressions can be reused, and make the backend abstraction cover arithmetic, elementary functions, comparisons, and formatting with explicit behavior for high-precision limitations.", "is_skeleton_contract": false, "parallelizable_after": ["SK1", "NumericBackend interface", "expression pipeline contract"], "skeleton_contract_docstring": ""}
- ST4: Implement matrix engine and matrix mode
  - UI description: Add stable matrix operations and a dedicated matrix workflow.
  - Codex instruction: Implement a separate matrix engine and matrix-mode UI for practical 2x2 through 6x6 work, including core operations, determinant, inverse, and linear solve using a numerically sensible elimination strategy with clear dimension and singularity diagnostics.
  - GPT reasoning: high
  - Parallel group: none
  - Depends on: ST1
  - Owned paths: src/core/matrix, src/services/matrix, src/features/matrix, tests/matrix
  - Verification: python -m pytest
  - Success criteria: Matrix mode supports input and operations for practical matrix sizes, linear solve uses partial pivoting or an equivalent stable method, singular or dimension errors are explicit, and tests verify determinant, inverse, solve, and edge-case behavior.
  - Metadata: {"candidate_block_id": "B3", "candidate_owned_paths": ["src/core/matrix", "src/features/matrix", "tests/matrix"], "implementation_notes": "Keep the matrix engine separate from the expression parser, use the shared numeric backend where feasible, and favor Gaussian elimination with partial pivoting or a clean equivalent as the minimum stable path.", "is_skeleton_contract": false, "parallelizable_after": ["SK1", "NumericBackend interface", "ComputationResult envelope"], "skeleton_contract_docstring": ""}
- ST5: Add numerical solver mode
  - UI description: Implement root-finding services and solver UI on top of the shared expression pipeline.
  - Codex instruction: Build a pure solver engine for one-variable root finding with Newton-Raphson and bisection, wire it into a dedicated solver mode UI, and ensure tolerance, iteration limits, convergence metadata, and failure diagnostics all flow through the shared result envelope.
  - GPT reasoning: medium
  - Parallel group: none
  - Depends on: ST2, ST3
  - Owned paths: src/core/solver, src/services/solver, src/features/solver, tests/solver
  - Verification: python -m pytest
  - Success criteria: Users can solve one-variable equations with initial guesses and interval bounds where appropriate, tolerance and max iterations are respected, invalid intervals and poor convergence are reported clearly, and tests cover success, failure, and non-convergent scenarios.
  - Metadata: {"candidate_block_id": "B4", "candidate_owned_paths": ["src/core/solver", "src/features/solver", "tests/solver"], "implementation_notes": "Build solver services on compiled expressions rather than UI state, prefer stable method selection between bisection and Newton, and make convergence behavior explicit rather than silent.", "is_skeleton_contract": false, "parallelizable_after": ["B2", "CalculatorSettings schema", "expression pipeline contract", "ComputationResult envelope"], "skeleton_contract_docstring": ""}
- ST6: Add numerical analysis tools
  - UI description: Implement differentiation and integration utilities with method choice and reliability warnings.
  - Codex instruction: Build a pure numerical-analysis engine and focused UI for point differentiation and interval integration, expose method selection such as central difference and trapezoidal or Simpson variants, and route tolerance-aware warnings and formatted outputs through the shared service boundary.
  - GPT reasoning: medium
  - Parallel group: none
  - Depends on: ST2, ST3
  - Owned paths: src/core/numerical, src/services/numerical, src/features/numerical-tools, tests/numerical
  - Verification: python -m pytest
  - Success criteria: Numerical tools support differentiation and integration with selectable methods, respect relevant settings and tolerances, surface warnings when estimates may be unreliable, and tests cover representative accurate and failure-prone numerical cases.
  - Metadata: {"candidate_block_id": "B5", "candidate_owned_paths": ["src/core/numerical", "src/features/numerical-tools", "tests/numerical"], "implementation_notes": "Use the compiled expression service and shared backend settings, keep the feature set focused, and prefer a small set of serious methods over broad but shallow tooling.", "is_skeleton_contract": false, "parallelizable_after": ["B2", "CalculatorSettings schema", "ComputationResult envelope"], "skeleton_contract_docstring": ""}
- ST7: Integrate product flow and project docs
  - UI description: Wire all feature slices into one runnable app and document how it works.
  - Codex instruction: Integrate the completed feature modules into the shared shell, finish any cross-feature wiring needed for a runnable maintainable prototype, and write the README so setup, run/test commands, architecture, numerical methods, precision model, limitations, and non-goals are explicit.
  - GPT reasoning: medium
  - Parallel group: none
  - Depends on: ST2, ST3, ST4, ST5, ST6
  - Owned paths: README.md, src/app/App.tsx, src/app/providers, tests/integration
  - Verification: python -m pytest
  - Success criteria: The app presents all planned modes in one coherent flow, shared settings and result presentation work consistently across features, any required integration tests or smoke validations are in place, and the README fully documents usage, architecture, numerical methods, precision limits, and non-goals.
  - Metadata: {"candidate_block_id": "B6", "candidate_owned_paths": ["README.md", "src/app/App.tsx", "tests/integration"], "implementation_notes": "Finish the runnable prototype by wiring feature slices together without breaking the frozen service boundaries, and capture the numerical and product decisions clearly in documentation.", "is_skeleton_contract": false, "parallelizable_after": ["B1", "B2", "B3", "B4", "B5"], "skeleton_contract_docstring": ""}

## Non-Goals
- Do not skip verification for any planned step.
- Do not widen scope beyond the current prompt unless the user updates the plan.

## Operating Constraints
- Treat each planned step as a checkpoint.
- In parallel mode, only dependency-ready steps with disjoint owned paths may run together.
- Commit and push after a verified step when an origin remote is configured.
- Users may edit only steps that have not started yet.
