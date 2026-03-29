from __future__ import annotations

from pathlib import Path
import subprocess
from typing import Any

from .errors import SubprocessTimeoutError


def _command_text(command: str | list[str]) -> str:
    if isinstance(command, str):
        return command
    return " ".join(str(part) for part in command)


def run_subprocess(
    command: str | list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    check: bool = False,
    timeout_seconds: float | None = None,
    capture_output: bool = False,
    text: bool = False,
    encoding: str | None = None,
    errors: str | None = None,
    shell: bool = False,
    stdin: Any = None,
    stdout: Any = None,
    stderr: Any = None,
    creationflags: int = 0,
    startupinfo: Any = None,
) -> subprocess.CompletedProcess[Any]:
    run_kwargs: dict[str, Any] = {
        "cwd": cwd,
        "env": env,
        "check": check,
        "timeout": timeout_seconds,
        "text": text,
        "encoding": encoding,
        "errors": errors,
        "shell": shell,
        "stdin": stdin,
        "stdout": stdout,
        "stderr": stderr,
        "creationflags": creationflags,
        "startupinfo": startupinfo,
    }
    if capture_output:
        run_kwargs["capture_output"] = True
    try:
        return subprocess.run(command, **run_kwargs)
    except subprocess.TimeoutExpired as exc:
        raise SubprocessTimeoutError(
            f"Command timed out after {timeout_seconds} seconds: {_command_text(command)}"
        ) from exc


def terminate_process_handle(
    process: subprocess.Popen[Any] | None,
    *,
    wait_timeout_seconds: float = 1.5,
) -> None:
    if process is None:
        return
    try:
        process.terminate()
        process.wait(timeout=wait_timeout_seconds)
    except subprocess.TimeoutExpired:
        process.kill()
        try:
            process.wait(timeout=wait_timeout_seconds)
        except subprocess.TimeoutExpired:
            process.wait()
    except OSError:
        return

