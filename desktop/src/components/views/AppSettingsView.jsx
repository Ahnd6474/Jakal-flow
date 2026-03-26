import { useI18n } from "../../i18n";

export function AppSettingsView({ settings, dirty, busy, onChangeSettings, onSaveSettings }) {
  const { language, languageOptions, setLanguage, t } = useI18n();

  return (
    <section className="workspace-view">
      <div className="view-header">
        <div>
          <span className="eyebrow">{t("tab.programSettings")}</span>
          <h2>{t("settings.programSettings")}</h2>
          <p>{t("settings.programSettingsDescription")}</p>
        </div>
        <button className="toolbar-button toolbar-button--accent" onClick={onSaveSettings} type="button" disabled={busy || !dirty}>
          {t("action.saveProgramSettings")}
        </button>
      </div>

      <div className="form-layout">
        <div className="form-section">
          <div className="subsection">
            <div className="subsection__header">
              <strong>{t("settings.application")}</strong>
              <span>{t("settings.applicationDescription")}</span>
            </div>
            <label className="field">
              <span>{t("common.language")}</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)} disabled={busy}>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="subsection">
            <div className="subsection__header">
              <strong>{t("settings.executionDefaults")}</strong>
              <span>{t("settings.executionDefaultsDescription")}</span>
            </div>
            <div className="choice-grid">
              <label className="field">
                <span>{t("field.approvalMode")}</span>
                <select
                  value={settings.approval_mode || "never"}
                  onChange={(event) => onChangeSettings((current) => ({ ...current, approval_mode: event.target.value }))}
                  disabled={busy}
                >
                  <option value="never">never</option>
                  <option value="on-failure">on-failure</option>
                  <option value="untrusted">untrusted</option>
                </select>
              </label>
              <label className="field">
                <span>{t("field.sandboxMode")}</span>
                <select
                  value={settings.sandbox_mode || "danger-full-access"}
                  onChange={(event) => onChangeSettings((current) => ({ ...current, sandbox_mode: event.target.value }))}
                  disabled={busy}
                >
                  <option value="danger-full-access">danger-full-access</option>
                  <option value="workspace-write">workspace-write</option>
                  <option value="read-only">read-only</option>
                </select>
              </label>
              <label className="field">
                <span>{t("field.checkpointInterval")}</span>
                <input
                  type="number"
                  min="1"
                  value={settings.checkpoint_interval_blocks || 1}
                  onChange={(event) =>
                    onChangeSettings((current) => ({
                      ...current,
                      checkpoint_interval_blocks: Math.max(1, Number.parseInt(event.target.value || "1", 10) || 1),
                    }))
                  }
                  disabled={busy}
                />
              </label>
              <label className="field">
                <span>{t("field.codexPath")}</span>
                <input
                  value={settings.codex_path || "codex.cmd"}
                  onChange={(event) => onChangeSettings((current) => ({ ...current, codex_path: event.target.value }))}
                  disabled={busy}
                />
              </label>
            </div>
            <div className="choice-list">
              <label className="choice-radio">
                <input
                  type="checkbox"
                  checked={Boolean(settings.allow_push)}
                  onChange={(event) => onChangeSettings((current) => ({ ...current, allow_push: event.target.checked }))}
                  disabled={busy}
                />
                <span>{t("option.allowPushAfterSafeRuns")}</span>
              </label>
              <label className="choice-radio">
                <input
                  type="checkbox"
                  checked={Boolean(settings.require_checkpoint_approval)}
                  onChange={(event) =>
                    onChangeSettings((current) => ({
                      ...current,
                      require_checkpoint_approval: event.target.checked,
                    }))
                  }
                  disabled={busy}
                />
                <span>{t("option.requireCheckpointApproval")}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
