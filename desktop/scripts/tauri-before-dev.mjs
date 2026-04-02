import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const devUrl = "http://127.0.0.1:1420";
const prepareRuntimeScript = join(scriptDir, "prepare-runtime.mjs");
const cleanViteCacheScript = join(scriptDir, "clean-vite-cache.mjs");
const viteBin = join(desktopRoot, "node_modules", "vite", "bin", "vite.js");

function runBlocking(command, args) {
  const completed = spawnSync(command, args, {
    cwd: desktopRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (completed.error) {
    throw completed.error;
  }
  if ((completed.status ?? 1) !== 0) {
    process.exit(completed.status ?? 1);
  }
}

async function isViteServerReady(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return false;
    }
    const body = await response.text();
    return body.includes("/@vite/client") || body.includes("React Refresh");
  } catch {
    return false;
  }
}

async function main() {
  runBlocking(process.execPath, [prepareRuntimeScript]);

  if (await isViteServerReady(devUrl)) {
    console.log(`Reusing existing Vite dev server at ${devUrl}.`);
    return;
  }

  runBlocking(process.execPath, [cleanViteCacheScript]);

  const child = spawn(process.execPath, [viteBin, "--host", "0.0.0.0", "--port", "1420"], {
    cwd: desktopRoot,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

await main();
