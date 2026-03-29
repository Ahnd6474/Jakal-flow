import { useI18n } from "../../i18n";
import { displayStatus } from "../../locale";
import { commandLabel, isDebuggingStatus, isPlanningProgressRunning, projectStatusWithJob, statusTone, toolbarProgressCaptionDisplay } from "../../utils";

/* ── Compact SVG icons ── */
function AppLogo() {
  return (
    <div className="toolbar-logo">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 4v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 20v-6h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function RemoteLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IdeToolbar({
  projectDetail,
  planDraft,
  pendingCheckpoint,
  busy,
  activeJob,
  activeCenterTab,
  shareUrl,
  shareBusy,
  onRefresh,
  onOpenSettings,
  onGeneratePlan,
  onRunPlan,
  onApproveCheckpoint,
  onGenerateShareLink,
}) {
  const planningRunning = isPlanningProgressRunning(projectDetail?.planning_progress);
  const projectStatusWithActiveJob = projectStatusWithJob(projectDetail?.project?.current_status || "idle", activeJob) || "idle";
  const projectStatus =
    String(activeJob?.status || "").trim().toLowerCase() === "running" || !planningRunning
      ? projectStatusWithActiveJob
      : "running:generate-plan";
  const livePlan = String(activeJob?.status || "").trim().toLowerCase() === "running" && projectDetail?.plan ? projectDetail.plan : planDraft;
  const projectName = projectDetail?.project?.display_name || projectDetail?.project?.slug || null;
  const { language, t } = useI18n();
  const normalizedProjectStatus = String(projectStatus || "").trim().toLowerCase();
  const statusLabel =
    String(activeJob?.status || "").trim().toLowerCase() === "running"
    && !isDebuggingStatus(projectDetail?.project?.current_status || "")
    && normalizedProjectStatus !== "running:merging"
      ? commandLabel(activeJob.command, language)
      : planningRunning && !isDebuggingStatus(projectDetail?.project?.current_status || "") && normalizedProjectStatus !== "running:merging"
        ? displayStatus("running:generate-plan", language)
      : displayStatus(projectStatus, language);
  const planStatusLabel = toolbarProgressCaptionDisplay(livePlan, language, {
    activeJob,
    planningProgress: projectDetail?.planning_progress,
  });
  const tone = statusTone(projectStatus);

  return (
    <header className="ide-toolbar">
      {/* Logo + Refresh */}
      <div className="ide-toolbar__group">
        <AppLogo />
        <button
          className="toolbar-btn toolbar-btn--icon"
          onClick={onRefresh}
          title={t("action.refresh")}
          type="button"
          aria-label={t("action.refresh")}
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Breadcrumb: Project > Status > Plan */}
      <nav className="ide-toolbar__breadcrumb" aria-label="Navigation">
        <span className="breadcrumb-segment">
          <strong>{projectName || t("project.none")}</strong>
        </span>
        <ChevronRight />
        <span className={`breadcrumb-segment breadcrumb-segment--${tone}`}>
          <span className={`chip-dot chip-dot--${tone}`} />
          {statusLabel}
        </span>
        {planStatusLabel ? (
          <>
            <ChevronRight />
            <span className="breadcrumb-segment breadcrumb-segment--dim">{planStatusLabel}</span>
          </>
        ) : null}
        {pendingCheckpoint ? (
          <>
            <ChevronRight />
            <span className="breadcrumb-segment breadcrumb-segment--warning">
              <span className="chip-dot chip-dot--warning" />
              {pendingCheckpoint.checkpoint_id || t("dashboard.checkpointPending")}
            </span>
          </>
        ) : null}
      </nav>

      {/* Quick actions */}
      <div className="ide-toolbar__group">
        <button
          className={`toolbar-btn ${activeCenterTab === "app-settings" ? "toolbar-btn--active" : ""}`}
          onClick={onOpenSettings}
          title={`${t("toolbar.programSettings")} (Ctrl+6)`}
          type="button"
          aria-label={t("toolbar.programSettings")}
        >
          <SettingsIcon />
        </button>

        <div className="toolbar-divider" />

        <button
          className={`toolbar-btn toolbar-btn--remote${shareUrl ? " toolbar-btn--active" : ""}`}
          onClick={onGenerateShareLink}
          type="button"
          disabled={shareBusy || !projectDetail?.project}
          title={shareUrl ? `Remote Control: ${shareUrl}` : (t("action.generateShareLink") || "Remote Control")}
        >
          <RemoteLinkIcon />
          <span>Remote Control</span>
        </button>

        <div className="toolbar-divider" />

        <button
          className="toolbar-btn"
          onClick={onGeneratePlan}
          type="button"
          disabled={busy}
          title={t("action.generatePlan")}
        >
          <PlanIcon />
          <span>{t("action.generatePlan")}</span>
        </button>

        <button
          className="toolbar-btn toolbar-btn--accent"
          onClick={onRunPlan}
          type="button"
          disabled={busy}
          title={t("action.runRemaining")}
        >
          <RunIcon />
          <span>{t("action.runRemaining")}</span>
        </button>

        {pendingCheckpoint ? (
          <button
            className="toolbar-btn toolbar-btn--accent"
            onClick={onApproveCheckpoint}
            type="button"
            disabled={busy}
            title={t("action.approveCheckpoint")}
          >
            <CheckIcon />
            <span>{t("action.approveCheckpoint")}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
