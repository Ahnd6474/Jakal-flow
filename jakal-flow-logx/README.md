# jakal-flow logx

This folder collects copied `jakal-flow` logs without changing the original source locations.

Rules used for this collection:
- Workspace project artifacts are stored under `workspace-projects/`
- Local repo root `jakal-flow-logs/` folders are stored under `local-repo-logs/`
- `metadata.json` is copied with each project so the original repo can be identified
- `reports/` is copied too when present for traceability

Collected items:
- `workspace-projects/codex-auto-workspace/c-users-alber-onedrive-github-calculator-main-b2c8e74450`
  - Source repo: `C:\Users\alber\OneDrive\문서\GitHub\calculator`
  - 67 log files, 2 report files
  - Latest file time: `2026-03-28T22:41:55`
- `workspace-projects/codex-auto-workspace/c-users-alber-onedrive-github-lit-main-54cb49de20`
  - Source repo: `C:\Users\alber\OneDrive\문서\GitHub\lit`
  - 2 log files
  - Latest file time: `2026-03-28T22:24:32`
- `workspace-projects/none/c-users-alber-onedrive-github-lit-main-54cb49de20`
  - Source repo: `C:\Users\alber\OneDrive\문서\GitHub\lit`
  - 43 log files
  - Latest file time: `2026-03-28T12:58:22`
- `workspace-projects/codex-auto-workspace-localtest/c-users-alber-onedrive-github-codex-auto-main-eb8d404f06`
  - Source repo: internal `.codex-auto-workspace-localtest` test project
  - 1 report file
  - Latest file time: `2026-03-24T20:52:38`
- `workspace-projects/codex-auto-workspace-test/repo-main-d1b7ce84a6`
  - Source repo: internal `.codex-auto-workspace-test` test project
  - 1 report file
  - Latest file time: `2026-03-24T20:51:38`
- `local-repo-logs/codex_auto/jakal-flow-logs`
  - Source repo: `C:\Users\alber\OneDrive\문서\GitHub\codex_auto`
  - 1 log file
  - Latest file time: `2026-03-29T19:50:27`

Notes:
- The `lit` project exists in two separate workspace snapshots, so both were kept.
- Original files were not moved or deleted. Everything here is a copy.
