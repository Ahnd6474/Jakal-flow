from __future__ import annotations


class JakalFlowError(RuntimeError):
    """Base error for handled jakal-flow failures."""


class RuntimeConfigError(JakalFlowError):
    """Raised when a runtime configuration file or override is invalid."""


class SubprocessExecutionError(JakalFlowError):
    """Raised when a subprocess helper cannot complete successfully."""


class SubprocessTimeoutError(SubprocessExecutionError):
    """Raised when a subprocess exceeds its configured timeout."""

