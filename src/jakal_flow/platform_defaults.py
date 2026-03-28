from __future__ import annotations

import os


def default_codex_path(provider: str = "") -> str:
    normalized_provider = str(provider or "").strip().lower()
    if normalized_provider in {"claude", "deepseek", "minimax", "glm"}:
        return "claude.cmd" if os.name == "nt" else "claude"
    if normalized_provider == "gemini":
        return "gemini.cmd" if os.name == "nt" else "gemini"
    if normalized_provider == "qwen_code":
        return "qwen.cmd" if os.name == "nt" else "qwen"
    return "codex.cmd" if os.name == "nt" else "codex"
