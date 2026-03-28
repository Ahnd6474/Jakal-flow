import { useI18n } from "../../i18n";
import { displayStatus } from "../../locale";
import { effectiveStepStatus, reasoningEffortLabel, runtimeSummary, statusTone } from "../../utils";

export function DetailsPane({ detail, planDraft, selectedStepId, modelPresets, onHide }) {
  const { t } = useI18n();
  const selectedStep = (planDraft?.steps || []).find((step) => step.step_id === selectedStepId) || null;
  const pendingCheckpoint = detail?.checkpoints?.pending || null;
  const selectedStepStatus = effectiveStepStatus(selectedStep, detail?.project?.current_status || "");

  return (
    <aside className="details-pane">
      {/* Header with title + hide */}
      <div className="tool-window__header" style={{ margin: "-8px -8px 0", padding: "0 6px", borderBottom: "1px solid var(--border)" }}>
        <div className="tool-tabs">
          <span className="tool-tab active">Inspector</span>
        </div>
        {onHide ? (
          <div className="tool-window__header-actions">
            <button
              className="tool-window__header-btn"
              onClick={onHide}
              type="button"
              title={`${t("action.dismiss")} (Alt+R)`}
              aria-label="Hide inspector"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <section className="details-card">
        <div className="details-card__header">
          <strong>{t("common.project")}</strong>
          <span className={`status-badge status-badge--${statusTone(detail?.project?.current_status)}`}>
            {displayStatus(detail?.project?.current_status || "idle", "en")}
          </span>
        </div>
        <dl className="details-list">
          <div>
            <dt>{t("common.name")}</dt>
            <dd>{detail?.project?.display_name || detail?.project?.slug || t("project.none")}</dd>
          </div>
          <div>
            <dt>{t("common.branch")}</dt>
            <dd>{detail?.project?.branch || t("common.unknown")}</dd>
          </div>
          <div>
            <dt>Path</dt>
            <dd>{detail?.project?.repo_path || t("common.unknown")}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{runtimeSummary(detail?.runtime || {}, modelPresets)}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>{detail?.project?.current_safe_revision || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="details-card">
        <div className="details-card__header">
          <strong>Step</strong>
          <span className={`status-badge status-badge--${statusTone(selectedStepStatus)}`}>
            {selectedStep ? displayStatus(selectedStepStatus, "en") : "—"}
          </span>
        </div>
        {selectedStep ? (
          <div className="details-text">
            <strong>{selectedStep.step_id}: {selectedStep.title}</strong>
            <p style={{ margin: "4px 0", color: "var(--text-muted)" }}>{selectedStep.display_description}</p>
            <p style={{ margin: "4px 0", fontSize: "11px", color: "var(--text-dim)" }}>
              Effort: {reasoningEffortLabel(selectedStep.reasoning_effort || detail?.runtime?.effort || "high")}
            </p>
            {selectedStep.success_criteria ? (
              <p style={{ margin: "4px 0", fontSize: "11px", color: "var(--text-dim)" }}>{selectedStep.success_criteria}</p>
            ) : null}
          </div>
        ) : (
          <div className="details-text" style={{ color: "var(--text-dim)", fontSize: "11px" }}>
            {t("sidebar.noRecordedCheckpoints") || "Select a step to inspect."}
          </div>
        )}
      </section>

      {pendingCheckpoint ? (
        <section className="details-card">
          <div className="details-card__header">
            <strong>Checkpoint</strong>
            <span className={`status-badge status-badge--${statusTone(pendingCheckpoint.status)}`}>
              {displayStatus(pendingCheckpoint.status || "pending", "en")}
            </span>
          </div>
          <div className="details-text">
            <strong>{pendingCheckpoint.checkpoint_id}</strong>
            {pendingCheckpoint.title ? <p style={{ margin: "4px 0" }}>{pendingCheckpoint.title}</p> : null}
            <p style={{ margin: "4px 0", fontSize: "11px", color: "var(--text-dim)" }}>
              Block {pendingCheckpoint.target_block}
            </p>
          </div>
        </section>
      ) : null}

      {detail?.reports?.closeout_report_text ? (
        <section className="details-card">
          <div className="details-card__header">
            <strong>Report</strong>
          </div>
          <div className="details-text">
            <pre>{detail.reports.closeout_report_text}</pre>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
