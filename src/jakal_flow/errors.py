from __future__ import annotations

import json

class JakalFlowError(RuntimeError):
    """Base error for handled jakal-flow failures."""


class RuntimeConfigError(JakalFlowError):
    """Raised when a runtime configuration file or override is invalid."""


class SubprocessExecutionError(JakalFlowError):
    """Raised when a subprocess helper cannot complete successfully."""


class SubprocessTimeoutError(SubprocessExecutionError):
    """Raised when a subprocess exceeds its configured timeout."""


class RequestRejectedError(JakalFlowError):
    """Raised when a request is well-formed but cannot run in the current state."""

    reason_code = "request_rejected"

    def __init__(
        self,
        message: str = "",
        *,
        reason_code: str | None = None,
        details: dict[str, object] | None = None,
        recoverable: bool | None = True,
    ) -> None:
        normalized = str(message).strip() or "Request rejected."
        super().__init__(normalized)
        self.reason_code = str(reason_code or self.reason_code).strip() or "request_rejected"
        self.details = dict(details or {})
        self.recoverable = bool(recoverable) if isinstance(recoverable, bool) else recoverable


class ExecutionFailure(JakalFlowError):
    """Base error for execution failures that carry a reason code."""

    reason_code = "execution_failed"

    def __init__(self, message: str = "", *, reason_code: str | None = None) -> None:
        normalized = str(message).strip() or "Execution failed."
        super().__init__(normalized)
        self.reason_code = str(reason_code or self.reason_code).strip() or "execution_failed"

    def to_log_fields(self) -> dict[str, str]:
        return {
            "failure_type": type(self).__name__,
            "failure_reason_code": self.reason_code,
        }


class ExecutionPreflightError(ExecutionFailure):
    """Raised when runtime preflight prevents a block from starting."""

    reason_code = "preflight_failed"


class AgentPassExecutionError(ExecutionFailure):
    """Raised when the agent/model pass itself fails."""

    reason_code = "agent_pass_failed"


class VerificationTestFailure(ExecutionFailure):
    """Raised when verification or regression tests fail after a pass."""

    reason_code = "verification_test_failed"


class ParallelExecutionFailure(ExecutionFailure):
    """Raised when a parallel worker or integration flow fails."""

    reason_code = "parallel_execution_failed"


class ParallelMergeConflictError(ParallelExecutionFailure):
    """Raised when a parallel merge conflict cannot be resolved automatically."""

    reason_code = "parallel_merge_conflict"


class PromotionRollbackError(ParallelExecutionFailure):
    """Raised when a failed promotion cannot be rolled back to the safe revision."""

    reason_code = "promotion_rollback_failed"


class MissingRecoveryArtifactsError(ExecutionFailure):
    """Raised when manual recovery cannot find the required failure artifacts."""

    reason_code = "recovery_artifacts_missing"


class MergeConflictStateError(ExecutionFailure):
    """Raised when manual merge recovery is requested without an active conflict."""

    reason_code = "merge_conflict_state_invalid"


class ContractWaveError(JakalFlowError):
    """Base error for contract-wave policy, spine, and CRR mutations."""


class ContractWaveValidationError(ContractWaveError, ValueError):
    """Raised when contract-wave mutation inputs are invalid."""


class ContractWaveLookupError(ContractWaveError, LookupError):
    """Raised when a requested contract-wave entity cannot be found."""


class ContractWavePersistenceError(ContractWaveError):
    """Raised when contract-wave state or audit artifacts cannot be persisted safely."""


HANDLED_OPERATION_EXCEPTIONS = (
    RuntimeError,
    ValueError,
    LookupError,
    OSError,
    TypeError,
    AttributeError,
    UnicodeError,
)

JSON_PARSE_EXCEPTIONS = (
    json.JSONDecodeError,
    TypeError,
    ValueError,
)

ARTIFACT_READ_EXCEPTIONS = (
    OSError,
    UnicodeError,
    ValueError,
)


_EXECUTION_FAILURE_TYPES: dict[str, type[ExecutionFailure]] = {
    ExecutionPreflightError.reason_code: ExecutionPreflightError,
    AgentPassExecutionError.reason_code: AgentPassExecutionError,
    VerificationTestFailure.reason_code: VerificationTestFailure,
    ParallelExecutionFailure.reason_code: ParallelExecutionFailure,
    ParallelMergeConflictError.reason_code: ParallelMergeConflictError,
    PromotionRollbackError.reason_code: PromotionRollbackError,
    MissingRecoveryArtifactsError.reason_code: MissingRecoveryArtifactsError,
    MergeConflictStateError.reason_code: MergeConflictStateError,
}


def execution_failure_from_reason(reason_code: str | None, message: str) -> ExecutionFailure:
    normalized = str(reason_code or "").strip().lower()
    failure_type = _EXECUTION_FAILURE_TYPES.get(normalized)
    if failure_type is None:
        return ExecutionFailure(message, reason_code=normalized or None)
    return failure_type(message)


def failure_log_fields(error: BaseException | None) -> dict[str, str]:
    if isinstance(error, ExecutionFailure):
        return error.to_log_fields()
    return {}
