import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AVAILABLE_LANGUAGE_OPTIONS, ensureLanguageCatalog, hasLanguageCatalog, normalizeLanguage, resolveInitialLanguage, translate } from "./locale";
import { usePersistentState } from "./hooks/usePersistentState";

const I18nContext = createContext(null);

export function I18nProvider({ children, initialLanguage = null }) {
  const [storedLanguage, setStoredLanguage] = usePersistentState(
    "jakal-flow:language",
    normalizeLanguage(initialLanguage || resolveInitialLanguage()),
  );
  const language = normalizeLanguage(storedLanguage);
  const [catalogReady, setCatalogReady] = useState(() => hasLanguageCatalog(language));

  useEffect(() => {
    let cancelled = false;
    setCatalogReady(hasLanguageCatalog(language));
    void ensureLanguageCatalog(language)
      .then(() => {
        if (!cancelled) {
          setCatalogReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalogReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      catalogReady,
      languageOptions: AVAILABLE_LANGUAGE_OPTIONS,
      setLanguage(nextLanguage) {
        const normalized = normalizeLanguage(nextLanguage);
        if (hasLanguageCatalog(normalized)) {
          setStoredLanguage(normalized);
          return;
        }
        void ensureLanguageCatalog(normalized)
          .catch(() => null)
          .finally(() => {
            setStoredLanguage(normalized);
          });
      },
      t(key, params = {}) {
        return translate(language, key, params);
      },
    }),
    [catalogReady, language, setStoredLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within an I18nProvider.");
  }
  return value;
}
