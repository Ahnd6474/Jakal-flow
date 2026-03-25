# Scope Guard

- Repository URL: {repo_url}
- Branch: {branch}
- Project slug: {repo_slug}

## Rules

1. Treat the saved project plan and reviewed execution steps as the current scope boundary unless the user explicitly changes them.
2. Mid-term planning must stay a strict subset of the saved plan.
3. Prefer small, reversible, test-backed changes.
4. Do not widen product scope automatically.
5. Only update README or docs to reflect verified repository state.
6. Roll back to the current safe revision when validation regresses.
