import { spawnSync } from "node:child_process";
import { delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..", "..");
const srcRoot = join(repoRoot, "src");
const targetDir = join(repoRoot, "rt");

const env = {
  ...process.env,
  PYTHONPATH: process.env.PYTHONPATH ? `${srcRoot}${delimiter}${process.env.PYTHONPATH}` : srcRoot,
};

const completed = spawnSync(
  process.env.JAKAL_FLOW_PYTHON || "python",
  ["-m", "jakal_flow.desktop_runtime_bundle", "--target", targetDir],
  {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  },
);

if (completed.error) {
  throw completed.error;
}

process.exit(completed.status ?? 1);
