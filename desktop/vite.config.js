import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function toKebabCase(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export default defineConfig({
  clearScreen: false,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (normalized.includes("/node_modules/react/") || normalized.includes("/node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (normalized.includes("/node_modules/@tauri-apps/")) {
            return "vendor-tauri";
          }
          if (
            normalized.includes("/src/generated_locale_data.js")
            || normalized.includes("/src/manual_locale_overrides.js")
          ) {
            return "i18n-catalog";
          }
          if (
            normalized.includes("/src/locale.js")
            || normalized.includes("/src/i18n.jsx")
            || normalized.includes("/src/utils.js")
            || normalized.includes("/src/api.js")
            || normalized.includes("/src/hooks/usePersistentState.js")
          ) {
            return "app-core";
          }
          const viewMatch = normalized.match(/\/src\/components\/views\/([^/]+)\.jsx$/);
          if (viewMatch) {
            return `view-${toKebabCase(viewMatch[1].replace(/View$/, ""))}`;
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 1420,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 1420,
    strictPort: true,
  },
});
