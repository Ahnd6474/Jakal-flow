# Active Task

- Selected at: 2026-03-27T03:02:29+00:00
- Candidate: ST7
- Scope refs: ST7

## Task
Integrate product flow and project docs

## Rationale
UI description: Wire all feature slices into one runnable app and document how it works.. Execution instruction: Integrate the completed feature modules into the shared shell, finish any cross-feature wiring needed for a runnable maintainable prototype, and write the README so setup, run/test commands, architecture, numerical methods, precision model, limitations, and non-goals are explicit.. Dependencies: ST2, ST3, ST4, ST5, ST6. Owned paths: README.md, src/app/App.tsx, src/app/providers, tests/integration. Metadata: {"candidate_block_id": "B6", "candidate_owned_paths": ["README.md", "src/app/App.tsx", "tests/integration"], "implementation_notes": "Finish the runnable prototype by wiring feature slices together without breaking the frozen service boundaries, and capture the numerical and product decisions clearly in documentation.", "is_skeleton_contract": false, "parallelizable_after": ["B1", "B2", "B3", "B4", "B5"], "skeleton_contract_docstring": ""}. Verification command: python -m pytest. Success criteria: The app presents all planned modes in one coherent flow, shared settings and result presentation work consistently across features, any required integration tests or smoke validations are in place, and the README fully documents usage, architecture, numerical methods, precision limits, and non-goals.

## Memory Context
Relevant prior memory:
- [success] block 1: Scaffold contracts and app skeleton :: Completed block with one search-enabled Codex pass.
- [summary] block 1: Scaffold contracts and app skeleton :: python -m pytest exited with 0
