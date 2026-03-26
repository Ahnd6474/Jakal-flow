import { useI18n } from "../../i18n";
import { commandLabel, deriveExecutionProgress, executionProgressCaption } from "../../utils";

function stepLabel(step) {
  return [step?.step_id, step?.title].filter(Boolean).join(" - ");
}

export function RunProgressPanel({ detail, planDraft, activeJob }) {
  const { language, t } = useI18n();
  const progress = deriveExecutionProgress(detail, planDraft, activeJob);

  if (!progress.isActive) {
    return null;
  }

  let currentWork = commandLabel(progress.command, language);
  if (progress.phase === "planning") {
    currentWork = t("run.planGeneration");
  } else if (progress.phase === "closeout") {
    currentWork = t("run.closeoutRunning");
  } else if (progress.runningStep) {
    currentWork = t("run.workingOnStep", { step: stepLabel(progress.runningStep) });
  } else if (progress.nextStep) {
    currentWork = t("run.preparingStep", { step: stepLabel(progress.nextStep) });
  }

  const progressSummary = executionProgressCaption(progress.plan, language);
  const percentLabel = progress.indeterminate ? t("status.running") : t("run.progressPercent", { percent: progress.percent ?? 0 });

  return (
    <section className="run-progress-banner">
      <div className="run-progress-banner__header">
        <div>
          <span className="eyebrow">{t("run.liveRun")}</span>
          <strong>{currentWork || t("action.backgroundJob")}</strong>
        </div>
        <span className="status-badge status-badge--info">{commandLabel(progress.command, language) || t("action.backgroundJob")}</span>
      </div>

      <div
        className="run-progress-banner__track"
        role="progressbar"
        aria-label={t("run.stepProgress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.indeterminate ? undefined : progress.percent ?? 0}
      >
        <div
          className={`run-progress-banner__fill ${progress.indeterminate ? "run-progress-banner__fill--indeterminate" : ""}`}
          style={progress.indeterminate ? undefined : { width: `${progress.visualPercent}%` }}
        />
      </div>

      <div className="run-progress-banner__meta">
        <span>{progressSummary}</span>
        {progress.totalSteps ? (
          <span>{t("run.completedStepsSummary", { completed: progress.completedSteps, total: progress.totalSteps })}</span>
        ) : null}
        {progress.readyIds.length > 1 ? <span>{t("run.readyNodeSummary", { count: progress.readyIds.length })}</span> : null}
        <span>{percentLabel}</span>
      </div>

      {progress.headlineActivity ? (
        <div className="run-progress-banner__activity">
          <span>{t("history.recentActivity")}</span>
          <strong>{progress.headlineActivity}</strong>
        </div>
      ) : null}
    </section>
  );
}
