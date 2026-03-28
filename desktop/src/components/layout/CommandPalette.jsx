import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../i18n";

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function matchScore(text, query) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (lowerText === lowerQuery) return 100;
  if (lowerText.startsWith(lowerQuery)) return 80;
  if (lowerText.includes(lowerQuery)) return 60;
  return 0;
}

export function CommandPalette({
  open,
  onClose,
  actions,
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.trim();
    return actions
      .map((action) => ({ ...action, score: Math.max(matchScore(action.label, q), matchScore(action.keywords || "", q)) }))
      .filter((action) => action.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [query, actions]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => Math.max(i - 1, 0));
        event.preventDefault();
        return;
      }
      if (event.key === "Enter" && filtered.length > 0) {
        const action = filtered[selectedIndex];
        if (action?.onExecute) {
          action.onExecute();
          onClose();
        }
        event.preventDefault();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, filtered, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="command-palette__backdrop" onClick={onClose} />
      <div className="command-palette">
        <div className="command-palette__input-row">
          <SearchIcon />
          <input
            ref={inputRef}
            className="command-palette__input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("action.search") || "Search actions..."}
            type="text"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="command-palette__kbd">Esc</kbd>
        </div>
        <div className="command-palette__list" role="listbox">
          {filtered.length ? (
            filtered.map((action, index) => (
              <button
                key={action.id}
                className={`command-palette__item ${index === selectedIndex ? "command-palette__item--selected" : ""}`}
                onClick={() => {
                  action.onExecute?.();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={index === selectedIndex}
                type="button"
              >
                <span className="command-palette__item-label">{action.label}</span>
                {action.shortcut ? <kbd className="command-palette__kbd">{action.shortcut}</kbd> : null}
                {action.category ? <span className="command-palette__item-category">{action.category}</span> : null}
              </button>
            ))
          ) : (
            <div className="command-palette__empty">{t("sidebar.emptyProjects") || "No results"}</div>
          )}
        </div>
      </div>
    </>
  );
}
