import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DYNAMIC_LANGUAGE_LOADERS } from "../src/generated_locale_loaders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, "..", "dist", "assets");

const budgets = [
  { label: "index bundle", pattern: /^index-.*\.js$/, maxBytes: 120 * 1024 },
  { label: "right sidebar shell", pattern: /^RightSidebarPane-.*\.js$/, maxBytes: 30 * 1024 },
  { label: "right sidebar detail panels", pattern: /^RightSidebarDetailPanels-.*\.js$/, maxBytes: 35 * 1024 },
  { label: "sidebar pane", pattern: /^SidebarPane-.*\.js$/, maxBytes: 22 * 1024 },
  { label: "command palette", pattern: /^CommandPalette-.*\.js$/, maxBytes: 5 * 1024 },
];

const localeMaxBytes = 15 * 1024;
const localePrefixes = Object.keys(DYNAMIC_LANGUAGE_LOADERS).sort((left, right) => right.length - left.length);

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

async function findLargestMatch(files, pattern) {
  const matches = files.filter((name) => pattern.test(name));
  if (!matches.length) {
    return null;
  }
  const sizedMatches = await Promise.all(matches.map(async (name) => ({
    name,
    size: (await stat(path.join(assetsDir, name))).size,
  })));
  return sizedMatches.sort((left, right) => right.size - left.size)[0];
}

async function main() {
  const files = await readdir(assetsDir);
  const failures = [];

  for (const budget of budgets) {
    const match = await findLargestMatch(files, budget.pattern);
    if (!match) {
      failures.push(`${budget.label}: missing output`);
      continue;
    }
    if (match.size > budget.maxBytes) {
      failures.push(`${budget.label}: ${formatKiB(match.size)} > ${formatKiB(budget.maxBytes)} (${match.name})`);
    } else {
      console.log(`${budget.label}: ${formatKiB(match.size)} (${match.name})`);
    }
  }

  const localeMatches = files.filter((name) => localePrefixes.some((prefix) => name.startsWith(`${prefix}-`)));
  if (!localeMatches.length) {
    failures.push("locale chunks: missing output");
  } else {
    const localeEntries = await Promise.all(localeMatches.map(async (name) => ({
      name,
      size: (await stat(path.join(assetsDir, name))).size,
    })));
    const largestLocale = localeEntries.sort((left, right) => right.size - left.size)[0];
    if (largestLocale.size > localeMaxBytes) {
      failures.push(`locale chunks: ${formatKiB(largestLocale.size)} > ${formatKiB(localeMaxBytes)} (${largestLocale.name})`);
    } else {
      console.log(`locale chunks: ${formatKiB(largestLocale.size)} (${largestLocale.name})`);
    }
  }

  if (failures.length) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Bundle budgets OK");
}

await main();
