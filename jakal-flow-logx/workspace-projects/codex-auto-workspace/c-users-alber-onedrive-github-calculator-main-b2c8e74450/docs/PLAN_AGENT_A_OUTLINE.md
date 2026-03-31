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
      "implementation_notes": "The matrix engine should stay separate from the expression parser and use the shared numeric backend contract where feasible so precision mode remains coherent. Gaussian elimination with partial pivoting is the minimum stable path; LU decomposition is acceptable if it cleanly supports determinant and solve reuse. Diagnostics should make singular and badly conditioned cases obvious rather than silently returning misleading values.",
      "testable_boundary": "Users can enter matrices, perform supported operations, solve `Ax=b`, and receive clear failures for invalid dimensions or singular systems, with dedicated engine tests covering sensitive numerical cases.",
      "candidate_owned_paths": [
        "src/core/matrix",
        "src/features/matrix",
        "tests/matrix"
      ],
      "parallelizable_after": [
        "SK1",
        "NumericBackend interface",
        "ComputationResult envelope"
      ],
      "parallel_notes": "This is a good parallel track because it is engine-isolated and does not need the expression compiler. Avoid shared edits to generic formatting or app-shell files beyond agreed extension points."
    },
    {
      "block_id": "B4",
      "goal": "Implement the numerical solver engine and solver mode UI",
      "work_items": [
        "Implement one-variable root finding with Newton-Raphson and bisection",
        "Add secant or finite-difference derivative fallback if it fits cleanly",
        "Support initial guess, interval bounds, tolerance, and max-iteration controls",
        "Surface convergence traces or failure reasons clearly in the Solver tab",
        "Parse equation inputs through the compiled expression engine and bind variable values safely",
        "Add tests for success cases, invalid intervals, derivative breakdown, and non-convergent scenarios"
      ],
      "implementation_notes": "This block should consume compiled expressions from the expression engine rather than reparsing ad hoc inside the solver. Solver outputs should use the shared result envelope and include iteration counts, residuals, and failure diagnostics so poor convergence is explicit. The engine must honor tolerance and iteration settings exactly because those settings are one of the product’s primary promises.",
      "testable_boundary": "Users can solve representative one-variable equations, inspect convergence or failure details, and see tolerance and iteration settings materially change solver behavior.",
      "candidate_owned_paths": [
        "src/core/solver",
        "src/features/solver",
        "tests/solver"
      ],
      "parallelizable_after": [
        "B2",
        "CalculatorSettings schema",
        "ComputationResult envelope"
      ],
      "parallel_notes": "This should not start before the expression engine contract is real because it depends on compiled evaluation. After B2 exists, it can proceed independently of matrix work and most app-shell work."
    },
    {
      "block_id": "B5",
      "goal": "Implement numerical differentiation and integration tools with method selection and reliability warnings",
      "work_items": [
        "Implement central-difference differentiation at a point",
        "Implement trapezoidal and Simpson integration, with adaptive Simpson if it lands cleanly",
        "Expose method selection, interval or point inputs, and tolerance-aware settings in the Numerical Tools tab",
        "Add warnings for unstable step sizes, oscillatory behavior, or unreliable integration outcomes",
        "Reuse compiled expressions and shared formatting/diagnostic presentation",
        "Add tests for known derivatives, known integrals, step-size sensitivity, and difficult numerical cases"
      ],
      "implementation_notes": "This engine should share the expression evaluation path and numeric backend so settings stay coherent across the app. The implementation should prefer a small number of solid methods over a wide menu of weak ones, and each method should report its assumptions and limitations through diagnostics. UI should let users compare methods without bloating the feature surface.",
      "testable_boundary": "Differentiation and integration return sensible results for standard functions, method choice is user-controlled, and the UI exposes reliability warnings when numerical conditions are poor.",
      "candidate_owned_paths": [
        "src/core/numerics",
        "src/features/numerical-tools",
        "tests/numerics"
      ],
      "parallelizable_after": [
        "B2",
        "CalculatorSettings schema",
        "ComputationResult envelope"
      ],
      "parallel_notes": "Like solver work, this depends on the expression engine but is otherwise isolated. It can run in parallel with B4 once B2 is stable."
    },
    {
      "block_id": "B6",
      "goal": "Harden integration, add end-to-end regression coverage, and write the product README",
      "work_items": [
        "Add cross-feature integration tests for persistence, formatting, and shared settings behavior",
        "Polish shared result rendering, error copy, and keyboard flows where feature work exposed rough edges",
        "Verify that precision mode, tolerance, and display mode behave coherently across Calculate, Matrix, Solver, and Numerical Tools",
        "Write the README with setup, run, test, architecture, numerical methods, precision model, limitations, and non-goals"
      ],
      "implementation_notes": "This block should stay narrow and mostly additive: documentation, integration tests, and small glue fixes rather than structural rewrites. It is the right place to catch mismatches between engine diagnostics and UI affordances, but not to invent new features. README content should document real implemented behavior and explicit limits, especially around high-precision transcendental support and numerical failure handling.",
      "testable_boundary": "The app has end-to-end regression coverage for its shared behaviors, documentation matches the shipped implementation, and remaining limitations are explicit rather than implicit.",
      "candidate_owned_paths": [
        "README.md",
        "tests/integration",
        "tests/e2e"
      ],
      "parallelizable_after": [
        "B1",
        "B2",
        "B3",
        "B4",
        "B5"
      ],
      "parallel_notes": "This is a final consolidation pass and should not compete for ownership with feature blocks. Keep source-code edits minimal and targeted if integration issues require small fixes."
    }
  ],
  "packing_notes": [
    "Use a real bootstrap wave: SK1 should establish the stack, feature directories, shared contracts, and persistence schema before any broad fan-out.",
    "Best first parallel wave after SK1: B1, B2, and B3. They have the highest value and the cleanest ownership separation if shared contracts are frozen.",
    "Treat B2 as the dependency root for B4 and B5. Do not force fake parallelism between solver/numerics and expression compilation before the compiled-expression interface is stable.",
    "Keep `src/core/contracts` and `src/persistence/schema.ts` owned only by the bootstrap step unless a later block needs a narrowly reviewed additive change.",
    "Avoid assigning broad roots like `src/core` or `src/features` to any single block; keep ownership at leaf directories to reduce merge risk in a greenfield repo.",
    "Leave final DAG edges to Planner Agent B, but expect a wave pattern of SK1 -> {B1,B2,B3} -> {B4,B5} -> B6."
  ]
}