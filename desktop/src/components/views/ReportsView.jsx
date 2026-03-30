import { openInSystem } from "../../api";
import { useI18n } from "../../i18n";

function contractListLabel(items = []) {
  return items.length ? items.join(", ") : "none";
}

function promotionLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized ? normalized.toUpperCase() : "N/A";
}

function formatDuration(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "0 ms";
  }
  return `${numeric.toFixed(numeric >= 100 ? 0 : 1)} ms`;
}

function SectionList({ items, emptyText, renderItem }) {
  if (!items.length) {
    return <p>{emptyText}</p>;
  }
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {items.map((item, index) => (
        <div
          key={item.request_id || item.manifest_id || item.version || `${index}`}
          style={{
            borderTop: index > 0 ? "1px solid rgba(148, 163, 184, 0.25)" : "none",
            paddingTop: index > 0 ? "12px" : 0,
          }}
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export function ReportsView({ reports }) {
  const { t } = useI18n();
  const closeoutReportPath = String(reports?.closeout_report_file || reports?.closeout_report_path || "").trim();
  const wordReportPath = String(reports?.word_report_path || "").trim();
  const wordReportEnabled = Boolean(reports?.word_report_enabled);
  const spine = reports?.spine || {};
  const commonRequirements = reports?.common_requirements || {};
  const lineageManifestSummary = reports?.lineage_manifest_summary || {};
  const lineageManifests = Array.isArray(reports?.lineage_manifests) ? reports.lineage_manifests : [];
  const openRequirements = Array.isArray(commonRequirements?.open_items) ? commonRequirements.open_items : [];
  const resolvedRequirements = Array.isArray(commonRequirements?.resolved_items) ? commonRequirements.resolved_items : [];
  const recentHistory = Array.isArray(spine?.recent_history) ? spine.recent_history : [];
  const sharedContractsText = String(reports?.shared_contracts_text || "").trim();
  const planningMetrics = reports?.planning_metrics || {};
  const planningStageSummary = Array.isArray(planningMetrics?.stage_summary) ? planningMetrics.stage_summary : [];
  const recentPlanningItems = Array.isArray(planningMetrics?.recent_items) ? planningMetrics.recent_items : [];
  const slowestPlanningItem = planningMetrics?.slowest_item || null;

  function handleOpen(path) {
    if (!path) {
      return;
    }
    openInSystem(path).catch(() => {});
  }

  return (
    <section className="workspace-view">
      <div className="view-header">
        <div>
          <span className="eyebrow">{t("reports.reports")}</span>
          <h2>{t("reports.reports")}</h2>
        </div>
      </div>

      <div className="overview-grid">
        <div className="content-card">
          <div className="content-card__header">
            <strong>Contract Wave Overview</strong>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <div>
              <strong>Current spine</strong>
              <p>{String(spine?.current_version || "spine-v1")}</p>
            </div>
            <div>
              <strong>Spine checkpoints</strong>
              <p>{Number(spine?.history_count || 0)}</p>
            </div>
            <div>
              <strong>Open CRRs</strong>
              <p>{Number(commonRequirements?.open_count || 0)}</p>
            </div>
            <div>
              <strong>Resolved CRRs</strong>
              <p>{Number(commonRequirements?.resolved_count || 0)}</p>
            </div>
            <div>
              <strong>Lineage manifests</strong>
              <p>{Number(lineageManifestSummary?.total || 0)}</p>
            </div>
            <div>
              <strong>Promotion mix</strong>
              <p>
                G {Number(lineageManifestSummary?.green_count || 0)} / Y {Number(lineageManifestSummary?.yellow_count || 0)} / R{" "}
                {Number(lineageManifestSummary?.red_count || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Planning Metrics</strong>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            <div>
              <strong>Captured stages</strong>
              <p>{Number(planningMetrics?.entry_count || 0)}</p>
            </div>
            <div>
              <strong>Latest sample</strong>
              <p>{String(planningMetrics?.latest_generated_at || "No planning metrics yet.")}</p>
            </div>
            <div>
              <strong>Slowest recent stage</strong>
              <p>
                {slowestPlanningItem
                  ? `${String(slowestPlanningItem.flow || "planning")} / ${String(slowestPlanningItem.stage || "stage")} (${formatDuration(slowestPlanningItem.duration_ms)})`
                  : "No planning metrics yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Spine History</strong>
          </div>
          <SectionList
            items={recentHistory}
            emptyText="No spine checkpoints recorded yet."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>{String(item.version || "spine-v1")}</strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  {String(item.created_at || "unknown time")} {item.lineage_id ? `| ${item.lineage_id}` : ""}{" "}
                  {item.step_id ? `/ ${item.step_id}` : ""}
                </span>
                <span style={{ fontSize: "12px" }}>
                  Contracts: {contractListLabel(Array.isArray(item.shared_contracts) ? item.shared_contracts : [])}
                </span>
                <span style={{ fontSize: "12px" }}>{String(item.notes || "No notes recorded.")}</span>
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Open Common Requirements</strong>
          </div>
          <SectionList
            items={openRequirements}
            emptyText="No open common requirement requests."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>
                  {String(item.request_id || "CRR")} · {String(item.title || "Shared requirement review")}
                </strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  {promotionLabel(item.promotion_class)} | {String(item.spine_version || spine?.current_version || "spine-v1")} |{" "}
                  {String(item.lineage_id || "no-lineage")} / {String(item.step_id || "no-step")}
                </span>
                <span style={{ fontSize: "12px" }}>{String(item.reason || item.notes || "No reason recorded.")}</span>
                <span style={{ fontSize: "12px" }}>
                  Contracts: {contractListLabel(Array.isArray(item.shared_contracts) ? item.shared_contracts : [])}
                </span>
                <span style={{ fontSize: "12px" }}>
                  Paths: {contractListLabel(Array.isArray(item.affected_paths) ? item.affected_paths : [])}
                </span>
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Recent Lineage Manifests</strong>
          </div>
          <SectionList
            items={lineageManifests}
            emptyText="No lineage manifests recorded yet."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>
                  {String(item.lineage_id || "LN?")} / {String(item.step_id || "ST?")}
                </strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  {promotionLabel(item.promotion_class)} | {String(item.step_type || "feature")} |{" "}
                  {String(item.scope_class || "free_owned")} | {String(item.spine_version || spine?.current_version || "spine-v1")}
                </span>
                <span style={{ fontSize: "12px" }}>{String(item.promotion_reason || "No promotion reason recorded.")}</span>
                <span style={{ fontSize: "12px" }}>
                  Contracts: {contractListLabel(Array.isArray(item.shared_contracts_used) ? item.shared_contracts_used : [])}
                </span>
                <span style={{ fontSize: "12px" }}>
                  Touched files: {contractListLabel(Array.isArray(item.touched_files) ? item.touched_files : [])}
                </span>
                {item.common_requirement_request_id ? (
                  <span style={{ fontSize: "12px" }}>CRR: {String(item.common_requirement_request_id)}</span>
                ) : null}
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Planning Stage Summary</strong>
          </div>
          <SectionList
            items={planningStageSummary}
            emptyText="No planning stage timings recorded yet."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>
                  {String(item.flow || "planning")} / {String(item.stage || "stage")}
                </strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Count {Number(item.count || 0)} | Avg {formatDuration(item.avg_ms)} | Max {formatDuration(item.max_ms)}
                </span>
                <span style={{ fontSize: "12px" }}>Total {formatDuration(item.total_ms)}</span>
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Recent Planning Timings</strong>
          </div>
          <SectionList
            items={recentPlanningItems}
            emptyText="No planning timings recorded yet."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>
                  {String(item.flow || "planning")} / {String(item.stage || "stage")}
                </strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  {String(item.generated_at || "unknown time")} | Block {String(item.block_index ?? "-")}
                </span>
                <span style={{ fontSize: "12px" }}>{formatDuration(item.duration_ms)}</span>
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Shared Contracts</strong>
          </div>
          <pre>{sharedContractsText || "# Shared Contracts\n\nNo shared contracts recorded yet."}</pre>
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>Resolved Common Requirements</strong>
          </div>
          <SectionList
            items={resolvedRequirements}
            emptyText="No resolved common requirement requests yet."
            renderItem={(item) => (
              <div style={{ display: "grid", gap: "4px" }}>
                <strong>
                  {String(item.request_id || "CRR")} · {String(item.title || "Shared requirement review")}
                </strong>
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  Resolved {String(item.resolved_at || "unknown time")} | {String(item.lineage_id || "no-lineage")} /{" "}
                  {String(item.step_id || "no-step")}
                </span>
                <span style={{ fontSize: "12px" }}>{String(item.reason || item.notes || "No reason recorded.")}</span>
              </div>
            )}
          />
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>{t("reports.closeoutReport")}</strong>
          </div>
          <pre>{reports?.closeout_report_text || t("reports.noCloseoutReport")}</pre>
          {closeoutReportPath ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="toolbar-button toolbar-button--ghost" onClick={() => handleOpen(closeoutReportPath)} type="button">
                {t("action.browse")}
              </button>
              {wordReportPath ? (
                <button className="toolbar-button toolbar-button--ghost" onClick={() => handleOpen(wordReportPath)} type="button">
                  Word
                </button>
              ) : null}
            </div>
          ) : (
            wordReportPath ? (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="toolbar-button toolbar-button--ghost" onClick={() => handleOpen(wordReportPath)} type="button">
                  Word
                </button>
              </div>
            ) : null
          )}
          {wordReportPath ? <p>{t("reports.wordReportReady", { path: wordReportPath })}</p> : null}
          {!wordReportPath && !wordReportEnabled ? <p>{t("reports.wordReportDisabled")}</p> : null}
        </div>

        <div className="content-card">
          <div className="content-card__header">
            <strong>{t("reports.attemptHistory")}</strong>
          </div>
          <pre>{reports?.attempt_history_text || t("reports.historyEmpty")}</pre>
        </div>
      </div>
    </section>
  );
}
