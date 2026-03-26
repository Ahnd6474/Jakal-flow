import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./i18n";
import { ensureLanguageCatalog, resolveInitialLanguage } from "./locale";
import "./styles.css";

const initialLanguage = resolveInitialLanguage();

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <I18nProvider initialLanguage={initialLanguage}>
        <App />
      </I18nProvider>
    </React.StrictMode>,
  );
}

void ensureLanguageCatalog(initialLanguage)
  .catch(() => null)
  .finally(() => {
    renderApp();
  });
