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

function MetricRow({ label, value, sub = "" }) {
  return (
    <div className="dashboard-metric-row">
      <div className="dashboard-metric-row__copy">
        <span className="dashboard-metric-row__label">{label}</span>
        {sub ? <span className="dashboard-metric-row__sub">{sub}</span> : null}
      </div>
      <strong className="dashboard-metric-row__value">{value}</strong>
    </div>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="dashboard-progress">
      <div className="dashboard-progress__bar">
        <div className="dashboard-progress__fill" style={{ width: `${pct}%` }} />
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
  const showStatus = dashboardVisibility.status !== false;
  const showRuntimeCard = dashboardVisibility.runtime_card !== false;
  const showUsageCard = dashboardVisibility.codex_usage_card !== false;
  const hasSideCards = showRuntimeCard || showUsageCard;

  const telemetryItems = useMemo(
    () => [
      {
        key: "remaining_steps",
        label: t("dashboard.remainingSteps"),
        value: String(stepCounts.pending),
        sub: allSteps.length ? `${stepCounts.completed}/${allSteps.length}` : copyFor(language, "No plan yet"),
      },
      {
        key: "checkpoint_pending",
        label: t("dashboard.checkpointPending"),
        value: detail?.checkpoints?.pending ? t("common.yes") : t("common.no"),
        sub: detail?.checkpoints?.pending?.title || "",
      },
      {
        key: "input_tokens",
        label: t("dashboard.inputTokens"),
        value: (usage.input_tokens ?? 0).toLocaleString(),
      },
      {
        key: "output_tokens",
        label: t("dashboard.outputTokens"),
        value: (usage.output_tokens ?? 0).toLocaleString(),
      },
      {
        key: "estimated_remaining",
        label: t("dashboard.estimatedRemaining"),
        value: formatDurationCompact(executionEstimate.remaining_seconds ?? 0, language),
      },
      ...(showEstimatedCost
        ? [
            {
              key: "estimated_cost",
              label: t("dashboard.estimatedCost"),
              value: formatUsd(costEstimate.estimated_total_cost_usd ?? 0, language),
            },
            {
              key: "actual_cost",
              label: t("dashboard.actualCost"),
              value: formatUsd(costEstimate?.recent?.estimated_cost_usd ?? 0, language),
            },
          ]
        : []),
      {
        key: "codex_plan",
        label: t("dashboard.codexPlan"),
        value: account.plan_type || t("common.unavailable"),
      },
      ...usageBuckets.map((bucket) => ({
        key: `rate_limit_${bucket.key}`,
        label: bucket.label,
        value: rateLimitRemainingLabel(bucket.window, language),
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

  if (!hasProject) {
    return (
      <section className="workspace-view dashboard-view">
        <div className="dashboard-page-header">
          <h2>{t("dashboard.noProjectSelected")}</h2>
        </div>
        <div className="content-card dashboard-empty-panel">
          <p>{copyFor(language, "Select or create a project to see runtime, plan, and usage telemetry.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-view dashboard-view">
      <div className="dashboard-page-header">
        <h2>{projectName}</h2>
        {showStatus ? <span className={`status-badge status-badge--${tone}`}>{activeStatus}</span> : null}
      </div>

      <div className={`dashboard-columns${hasSideCards ? "" : " dashboard-columns--single"}`}>
        <div className="dashboard-column">
          <div className="content-card">
            <div className="content-card__header">
              <strong>Overview</strong>
            </div>
            <div className="dashboard-detail-list">
              {showStatus ? (
                <div className="dashboard-detail-row">
                  <span>Status</span>
                  <strong>{activeStatus}</strong>
                </div>
              ) : null}
              <div className="dashboard-detail-row">
                <span>Current Focus</span>
                <strong>{headlineStep ? formatStepLabel(headlineStep, language) : copyFor(language, "No active step")}</strong>
              </div>
              <div className="dashboard-detail-row">
                <span>Progress</span>
                <strong>{planSummary || copyFor(language, "No plan yet")}</strong>
              </div>
              <div className="dashboard-detail-row">
                <span>Branch</span>
                <strong>{detail?.project?.branch || t("common.unknown")}</strong>
              </div>
              <div className="dashboard-detail-row">
                <span>Origin</span>
                <strong style={{ wordBreak: "break-word" }}>{detail?.project?.origin_url || t("common.localOnly")}</strong>
              </div>
              {detail?.checkpoints?.pending ? (
                <div className="dashboard-detail-row">
                  <span>Checkpoint</span>
                  <strong>{detail.checkpoints.pending.title || copyFor(language, "Pending approval")}</strong>
                </div>
              ) : null}
            </div>

            {allSteps.length ? (
              <div className="dashboard-progress-block">
                <div className="dashboard-progress-summary">
                  <span>{stepCounts.completed}/{allSteps.length} {copyFor(language, "steps complete")}</span>
                  <span>{copyFor(language, "Remaining")}: {formatDurationCompact(executionEstimate.remaining_seconds ?? 0, language)}</span>
                </div>
                <ProgressBar completed={stepCounts.completed} total={allSteps.length} />
              </div>
            ) : null}
          </div>

          {telemetryItems.length ? (
            <div className="content-card">
              <div className="content-card__header">
                <strong>Telemetry</strong>
              </div>
              <div className="dashboard-metric-list">
                {telemetryItems.map((item) => (
                  <MetricRow key={item.key} label={item.label} value={item.value} sub={item.sub} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {hasSideCards ? (
          <div className="dashboard-column">
            {showRuntimeCard ? (
              <div className="content-card">
                <div className="content-card__header">
                  <strong>{t("dashboard.runtime")}</strong>
                </div>
                <div className="dashboard-detail-list">
                  <div className="dashboard-detail-row"><span>Model</span><strong>{runtimeSummary(detail?.runtime || {}, modelPresets, language, modelCatalog)}</strong></div>
                  <div className="dashboard-detail-row"><span>{t("field.parallelWorkers")}</span><strong>{parallelLimitValue}</strong></div>
                  <div className="dashboard-detail-row"><span>{t("run.parallelLimit")}</span><strong>{parallelLimitDetails}</strong></div>
                  <div className="dashboard-detail-row"><span>{t("run.estimatedTotal")}</span><strong>{formatDurationCompact(executionEstimate.estimated_total_seconds ?? 0, language)}</strong></div>
                  {showEstimatedCost ? (
                    <div className="dashboard-detail-row"><span>{t("dashboard.estimatedCost")}</span><strong>{formatUsd(costEstimate.estimated_total_cost_usd ?? 0, language)}</strong></div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {showUsageCard ? (
              <div className="content-card">
                <div className="content-card__header">
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
                  <div className="dashboard-empty-panel">
                    <p>{codexStatus.error || t("common.unavailable")}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}, dashboardViewPropsEqual);
