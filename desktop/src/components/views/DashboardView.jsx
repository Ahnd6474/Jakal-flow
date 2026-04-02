import { memo, useMemo } from "react";
import { useI18n } from "../../i18n";
import { displayStatus } from "../../locale";
import {
  codexUsageBuckets,
  executionProgressCaptionDisplay,
  formatDurationCompact,
  formatUsd,
  normalizeDashboardVisibility,
  parallelLimitDescription,
  parallelWorkerLabel,
  projectDetailStatus,
  rateLimitRemainingLabel,
  rateLimitWindowSummary,
  runtimeSummary,
  shouldShowEstimatedCost,
  statusTone,
  visibleExecutionJob,
} from "../../utils";

function copyFor(language, english, korean = english) {
  return language === "ko" ? korean : english;
}

function formatStepLabel(step, language) {
  const stepId = String(step?.step_id || "").trim();
  const title = String(step?.title || step?.display_description || "").trim();
  if (stepId && title) {
    return `${stepId} - ${title}`;
  }
  if (stepId) {
    return stepId;
  }
  if (title) {
    return title;
  }
  return copyFor(language, "No step selected");
}

function Stat({ label, value, tone = "neutral", icon, sub }) {
  return (
    <div className={`metric-card metric-card--${tone} metric-card--dashboard`}>
      <div className="metric-card__topline">
        {icon ? <div className="metric-card__icon-sm">{icon}</div> : null}
        <span className="metric-card__label">{label}</span>
      </div>
      <strong>{value}</strong>
      {sub ? <span className="metric-card__sub">{sub}</span> : null}
    </div>
  );
}

function SummaryItem({ label, value, tone = "neutral" }) {
  return (
    <div className="dashboard-summary-item">
      <span>{label}</span>
      <strong className={`dashboard-summary-item__value dashboard-summary-item__value--${tone}`}>{value}</strong>
    </div>
  );
}

function DashboardCallout({ title, body, tone = "neutral" }) {
  return (
    <div className={`dashboard-callout dashboard-callout--${tone}`}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function StepsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckpointIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TokenInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function TokenOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function DashboardHeaderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RuntimeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function UsageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <line x1="7" y1="4" x2="7" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 10a8 8 0 0 1-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M13 3L6 14h5l-1 7 8-12h-5l0-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ completed, total, tone }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="dashboard-progress">
      <div className="dashboard-progress__bar">
        <div
          className={`dashboard-progress__fill dashboard-progress__fill--${tone || "info"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="dashboard-progress__label">{pct}%</span>
    </div>
  );
}

function dashboardViewPropsEqual(previousProps, nextProps) {
  return (
    previousProps.detail === nextProps.detail
    && previousProps.planDraft === nextProps.planDraft
    && previousProps.modelPresets === nextProps.modelPresets
    && previousProps.modelCatalog === nextProps.modelCatalog
    && previousProps.activeJob === nextProps.activeJob
    && previousProps.programSettings === nextProps.programSettings
  );
}

export const DashboardView = memo(function DashboardView({ detail, planDraft, modelPresets, modelCatalog, activeJob, programSettings }) {
  const { language, t } = useI18n();
  const executionJob = visibleExecutionJob(activeJob);
  const usage = detail?.snapshot?.recent_usage || {};
  const codexStatus = detail?.codex_status || {};
  const runtimeInsights = detail?.runtime_insights || {};
  const executionEstimate = runtimeInsights?.execution || {};
  const costEstimate = runtimeInsights?.cost || {};
  const parallelInsight = runtimeInsights?.parallel || {};
  const account = codexStatus.account || {};
  const usageBuckets = useMemo(
    () => codexUsageBuckets(codexStatus, language),
    [codexStatus, language],
  );
  const dashboardVisibility = normalizeDashboardVisibility(programSettings?.dashboard_visibility);
  const livePlan = executionJob?.status === "running" && detail?.plan ? detail.plan : (detail?.plan || planDraft);
  const allSteps = livePlan?.steps || [];
  const stepCounts = useMemo(() => {
    let completed = 0;
    let pending = 0;
    for (const step of allSteps) {
      if (step?.status === "completed") {
        completed += 1;
      } else {
        pending += 1;
      }
    }
    return { completed, pending };
  }, [allSteps]);
  const parallelLimitValue = parallelWorkerLabel(parallelInsight.recommended_workers ?? 1, language);
  const parallelLimitDetails = parallelLimitDescription(parallelInsight, language);
  const showEstimatedCost = shouldShowEstimatedCost(detail?.runtime || {}, costEstimate);
  const activeStatusKey = projectDetailStatus(detail, executionJob) || "idle";
  const activeStatus = displayStatus(activeStatusKey, language);
  const tone = statusTone(activeStatusKey);
  const projectName = detail?.project?.display_name || detail?.project?.slug || t("dashboard.noProjectSelected");
  const hasProject = Boolean(detail?.project?.display_name || detail?.project?.slug || detail?.project?.repo_path);
  const runningStep = allSteps.find((step) => ["running", "integrating"].includes(String(step?.status || "").trim().toLowerCase()));
  const nextStep = allSteps.find((step) => String(step?.status || "").trim().toLowerCase() !== "completed");
  const headlineStep = runningStep || nextStep || null;
  const planSummary = executionProgressCaptionDisplay(livePlan, language);
  const codexUsageAvailable = (usageBuckets || []).some((bucket) => bucket.window);

  const metricItems = useMemo(
    () => [
      {
        key: "remaining_steps",
        label: t("dashboard.remainingSteps"),
        value: stepCounts.pending,
        tone: stepCounts.pending ? "info" : "success",
        icon: <StepsIcon />,
        sub: allSteps.length ? `${stepCounts.completed}/${allSteps.length}` : copyFor(language, "No plan yet"),
      },
      {
        key: "checkpoint_pending",
        label: t("dashboard.checkpointPending"),
        value: detail?.checkpoints?.pending ? t("common.yes") : t("common.no"),
        tone: detail?.checkpoints?.pending ? "warning" : "neutral",
        icon: <CheckpointIcon />,
        sub: detail?.checkpoints?.pending?.title || "",
      },
      {
        key: "input_tokens",
        label: t("dashboard.inputTokens"),
        value: (usage.input_tokens ?? 0).toLocaleString(),
        tone: "neutral",
        icon: <TokenInIcon />,
      },
      {
        key: "output_tokens",
        label: t("dashboard.outputTokens"),
        value: (usage.output_tokens ?? 0).toLocaleString(),
        tone: "neutral",
        icon: <TokenOutIcon />,
      },
      {
        key: "estimated_remaining",
        label: t("dashboard.estimatedRemaining"),
        value: formatDurationCompact(executionEstimate.remaining_seconds ?? 0, language),
        tone: executionEstimate.remaining_seconds ? "info" : "neutral",
        icon: <ClockIcon />,
      },
      ...(showEstimatedCost
        ? [
            {
              key: "estimated_cost",
              label: t("dashboard.estimatedCost"),
              value: formatUsd(costEstimate.estimated_total_cost_usd ?? 0, language),
              tone: "neutral",
            },
            {
              key: "actual_cost",
              label: t("dashboard.actualCost"),
              value: formatUsd(costEstimate?.recent?.estimated_cost_usd ?? 0, language),
              tone: "neutral",
            },
          ]
        : []),
      {
        key: "codex_plan",
        label: t("dashboard.codexPlan"),
        value: account.plan_type || t("common.unavailable"),
        tone: "neutral",
        icon: <PlanIcon />,
      },
      ...usageBuckets.map((bucket) => ({
        key: `rate_limit_${bucket.key}`,
        label: bucket.label,
        value: rateLimitRemainingLabel(bucket.window, language),
        tone: bucket.window && (bucket.window.remaining_percent ?? 0) < 25 ? "warning" : "success",
      })),
    ].filter((item) => dashboardVisibility[item.key] !== false),
    [
      account.plan_type,
      allSteps.length,
      costEstimate,
      dashboardVisibility,
      detail?.checkpoints?.pending,
      detail?.checkpoints?.pending?.title,
      executionEstimate.remaining_seconds,
      language,
      showEstimatedCost,
      stepCounts.completed,
      stepCounts.pending,
      t,
      usage.input_tokens,
      usage.output_tokens,
      usageBuckets,
    ],
  );

  const summaryItems = useMemo(
    () => [
      {
        key: "branch",
        label: t("common.branch"),
        value: detail?.project?.branch || t("common.unknown"),
        tone: "neutral",
      },
      {
        key: "focus",
        label: copyFor(language, "Current Focus"),
        value: headlineStep ? formatStepLabel(headlineStep, language) : copyFor(language, "No plan yet"),
        tone: runningStep ? "info" : (headlineStep ? "neutral" : "warning"),
      },
      {
        key: "summary",
        label: copyFor(language, "Plan Summary"),
        value: planSummary || copyFor(language, "No plan yet"),
        tone: allSteps.length ? tone : "warning",
      },
    ],
    [allSteps.length, detail?.project?.branch, headlineStep, language, planSummary, runningStep, t, tone],
  );

  if (!hasProject) {
    return (
      <section className="workspace-view dashboard-view">
        <div className="view-header">
          <div className="dashboard-header-stack">
            <div className="view-header-icon">
              <DashboardHeaderIcon />
            </div>
            <div>
              <span className="eyebrow">{t("dashboard.dashboard")}</span>
              <h2>{t("dashboard.noProjectSelected")}</h2>
              <p>{copyFor(language, "Select or create a project to see runtime, plan, and usage telemetry.")}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-empty-state content-card">
          <div className="dashboard-empty-state__icon">
            <DashboardHeaderIcon />
          </div>
          <div className="dashboard-empty-state__body">
            <strong>{copyFor(language, "No project selected")}</strong>
            <p>{copyFor(language, "The dashboard is ready, but there is no active workspace to summarize yet.")}</p>
          </div>
          <div className="dashboard-empty-state__grid">
            <div className="dashboard-callout dashboard-callout--neutral">
              <strong>{copyFor(language, "What appears here")}</strong>
              <span>{copyFor(language, "Project status, plan progress, runtime limits, and Codex account usage.")}</span>
            </div>
            <div className="dashboard-callout dashboard-callout--info">
              <strong>{copyFor(language, "Next step")}</strong>
              <span>{copyFor(language, "Choose a workspace from the top selector or create a new one to populate the dashboard.")}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-view dashboard-view">
      <div className="view-header">
        <div className="dashboard-header-stack">
          <div className="view-header-icon">
            <DashboardHeaderIcon />
          </div>
          <div>
            <span className="eyebrow">{t("dashboard.dashboard")}</span>
            <h2>{projectName}</h2>
            <p>{copyFor(language, "Operational overview for the current workspace.")}</p>
          </div>
        </div>
      </div>

      {dashboardVisibility.status !== false ? (
        <div className={`dashboard-hero dashboard-hero--${tone}`}>
          <div className="dashboard-hero__main">
            <div className="dashboard-hero__identity">
              <span className={`status-badge status-badge--${tone}`}>{activeStatus}</span>
              <strong className="dashboard-hero__project-name">{projectName}</strong>
              <p className="dashboard-hero__summary">{planSummary || copyFor(language, "No plan yet")}</p>
            </div>
            <div className="dashboard-hero__highlights">
              <span className="dashboard-hero__pill">
                <BranchIcon />
                {detail?.project?.branch || t("common.unknown")}
              </span>
              <span className="dashboard-hero__pill">
                <SparkIcon />
                {headlineStep ? formatStepLabel(headlineStep, language) : copyFor(language, "No active step")}
              </span>
              {detail?.checkpoints?.pending ? (
                <span className="dashboard-hero__pill dashboard-hero__pill--warning">
                  <CheckpointIcon />
                  {copyFor(language, "Checkpoint pending")}
                </span>
              ) : null}
            </div>
          </div>
          <div className="dashboard-hero__right">
            <span className="dashboard-hero__progress-label">
              {stepCounts.completed}/{allSteps.length || 0} {copyFor(language, "steps done")}
            </span>
            <ProgressBar completed={stepCounts.completed} total={allSteps.length} tone={tone} />
            <div className="dashboard-hero__meta">
              <span>{copyFor(language, "Remaining")}: {formatDurationCompact(executionEstimate.remaining_seconds ?? 0, language)}</span>
              {showEstimatedCost ? <span>{copyFor(language, "Estimate")}: {formatUsd(costEstimate.estimated_total_cost_usd ?? 0, language)}</span> : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="dashboard-summary-grid">
        {summaryItems.map((item) => (
          <SummaryItem key={item.key} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </div>

      {detail?.checkpoints?.pending ? (
        <DashboardCallout
          title={copyFor(language, "Checkpoint approval required")}
          body={detail.checkpoints.pending.title || copyFor(language, "Review the pending checkpoint before the run can continue.")}
          tone="warning"
        />
      ) : null}

      {dashboardVisibility.codex_usage_card && !codexUsageAvailable && codexStatus.error ? (
        <DashboardCallout
          title={copyFor(language, "Codex usage is temporarily unavailable")}
          body={codexStatus.error}
          tone="danger"
        />
      ) : null}

      {metricItems.length ? (
        <div className="metrics-grid">
          {metricItems.map((item) => (
            <Stat
              key={item.key}
              label={item.label}
              value={item.value}
              tone={item.tone}
              icon={item.icon}
              sub={item.sub}
            />
          ))}
        </div>
      ) : null}

      <div className="dashboard-secondary-grid">
        <div className="content-card dashboard-snapshot-card">
          <div className="content-card__header">
            <SparkIcon />
            <strong>{copyFor(language, "Execution Snapshot")}</strong>
          </div>
          <div className="dashboard-detail-list">
            {dashboardVisibility.status !== false ? (
              <div className="dashboard-detail-row">
                <span>{copyFor(language, "Status")}</span>
                <strong>{activeStatus}</strong>
              </div>
            ) : null}
            <div className="dashboard-detail-row">
              <span>{copyFor(language, "Current Focus")}</span>
              <strong>{headlineStep ? formatStepLabel(headlineStep, language) : copyFor(language, "No active step")}</strong>
            </div>
            <div className="dashboard-detail-row">
              <span>{copyFor(language, "Checkpoint")}</span>
              <strong>{detail?.checkpoints?.pending?.title || copyFor(language, "None pending")}</strong>
            </div>
            <div className="dashboard-detail-row">
              <span>{copyFor(language, "Origin")}</span>
              <strong style={{ wordBreak: "break-word" }}>{detail?.project?.origin_url || t("common.localOnly")}</strong>
            </div>
          </div>
        </div>

        {dashboardVisibility.runtime_card ? (
          <div className="content-card">
            <div className="content-card__header">
              <RuntimeIcon />
              <strong>{t("dashboard.runtime")}</strong>
            </div>
            <div className="dashboard-detail-list">
              <div className="dashboard-detail-row"><span>Model</span><strong>{runtimeSummary(detail?.runtime || {}, modelPresets, language, modelCatalog)}</strong></div>
              <div className="dashboard-detail-row"><span>{t("field.parallelWorkers")}</span><strong>{parallelLimitValue}</strong></div>
              <div className="dashboard-detail-row"><span>{t("run.parallelLimit")}</span><strong>{parallelLimitDetails}</strong></div>
              <div className="dashboard-detail-row"><span>{t("run.estimatedTotal")}</span><strong>{formatDurationCompact(executionEstimate.estimated_total_seconds ?? 0, language)}</strong></div>
              <div className="dashboard-detail-row"><span>{t("common.branch")}</span><strong>{detail?.project?.branch || t("common.unknown")}</strong></div>
              <div className="dashboard-detail-row"><span>{t("dashboard.origin")}</span><strong style={{ wordBreak: "break-all", fontSize: "11px" }}>{detail?.project?.origin_url || t("common.localOnly")}</strong></div>
            </div>
          </div>
        ) : null}

        {dashboardVisibility.codex_usage_card ? (
          <div className="content-card">
            <div className="content-card__header">
              <UsageIcon />
              <strong>{t("dashboard.codexUsage")}</strong>
            </div>
            {codexUsageAvailable ? (
              <div className="dashboard-detail-list">
                <div className="dashboard-detail-row"><span>{t("common.auth")}</span><strong>{account.type || t("common.unavailable")}</strong></div>
                <div className="dashboard-detail-row"><span>{t("common.account")}</span><strong>{account.email || t("common.unavailable")}</strong></div>
                {usageBuckets.map((bucket) => (
                  <div key={bucket.key} className="dashboard-detail-row">
                    <span>{bucket.label}</span>
                    <strong>{rateLimitWindowSummary(bucket.window, language)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-inline-empty">
                <strong>{copyFor(language, "Usage data unavailable")}</strong>
                <span>{codexStatus.error || t("common.unavailable")}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}, dashboardViewPropsEqual);
