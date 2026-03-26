import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, "..");
const tempDirs = [];

after(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

async function importBundledModule(key, contents) {
  const result = await build({
    absWorkingDir: desktopRoot,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    write: false,
    jsx: "automatic",
    jsxImportSource: "react",
    external: ["react", "react-dom/server", "react/jsx-runtime"],
    loader: {
      ".js": "jsx",
      ".jsx": "jsx",
    },
    stdin: {
      contents,
      loader: "jsx",
      resolveDir: desktopRoot,
      sourcefile: `${key}.jsx`,
    },
  });
  const tempRoot = path.join(desktopRoot, ".tmp-render");
  await mkdir(tempRoot, { recursive: true });
  const tempDir = await mkdtemp(path.join(tempRoot, `${key}-`));
  tempDirs.push(tempDir);
  const modulePath = path.join(tempDir, `${key}.mjs`);
  await writeFile(modulePath, result.outputFiles[0].text, "utf-8");
  return import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
}

function noop() {}

function baseWorkspaceProps(overrides = {}) {
  return {
    activeTab: "run",
    onChangeTab: noop,
    detail: {
      project: {
        current_status: "plan_ready",
      },
      runtime: {
        execution_mode: "serial",
        effort: "medium",
      },
      run_control: {
        stop_after_current_step: false,
      },
    },
    form: {
      runtime: {
        execution_mode: "serial",
      },
    },
    shareSettings: {
      bind_host: "127.0.0.1",
      public_base_url: "",
    },
    programSettings: {
      developer_mode: false,
    },
    planDraft: {
      project_prompt: "Ship the UI",
      execution_mode: "serial",
      closeout_status: "not_started",
      steps: [
        {
          step_id: "ST1",
          title: "Plan",
          display_description: "Prepare the flow",
          codex_description: "Prepare the flow",
          success_criteria: "Flow exists",
          reasoning_effort: "medium",
          status: "completed",
        },
        {
          step_id: "ST2",
          title: "Build",
          display_description: "Build the screen",
          codex_description: "Build the screen",
          success_criteria: "Screen renders",
          reasoning_effort: "high",
          status: "pending",
        },
      ],
    },
    selectedStepId: "ST2",
    modelPresets: [],
    modelCatalog: [],
    busy: false,
    onChangeForm: noop,
    onChangeProgramSettings: noop,
    onChooseDirectory: noop,
    onDeleteProject: noop,
    onGenerateShareLink: noop,
    onCopyShareLink: noop,
    onRevokeShareLink: noop,
    onChangeShareSettings: noop,
    onPromptChange: noop,
    onGeneratePlan: noop,
    onSavePlan: noop,
    onResetPlan: noop,
    onRunPlan: noop,
    onRunCloseout: noop,
    onRequestStop: noop,
    onSelectStep: noop,
    onUpdateStepField: noop,
    onSaveStepLocal: noop,
    onAddStep: noop,
    onDeleteStep: noop,
    onMoveStep: noop,
    activeJob: null,
    ...overrides,
  };
}

test("CenterWorkspace renders the serial flow view for serial plans", async () => {
  const module = await importBundledModule(
    "center-workspace-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { CenterWorkspace } from "./src/components/layout/CenterWorkspace.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(CenterWorkspace, props))
        );
      }
    `,
  );

  const html = module.renderComponent(baseWorkspaceProps());

  assert.match(html, /Execution Flow/);
  assert.match(html, /Flow Chart/);
  assert.match(html, /Execution Mode/);
  assert.match(html, /Serial/);
  assert.doesNotMatch(html, /Execution Tree/);
});

test("CenterWorkspace renders the parallel execution tree for parallel plans", async () => {
  const module = await importBundledModule(
    "parallel-workspace-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { CenterWorkspace } from "./src/components/layout/CenterWorkspace.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(CenterWorkspace, props))
        );
      }
    `,
  );

  const html = module.renderComponent(
    baseWorkspaceProps({
      detail: {
        project: {
          current_status: "plan_ready",
        },
        runtime: {
          execution_mode: "parallel",
          effort: "medium",
        },
      },
      form: {
        runtime: {
          execution_mode: "parallel",
        },
      },
      planDraft: {
        project_prompt: "Ship the UI",
        execution_mode: "parallel",
        closeout_status: "not_started",
        steps: [
          {
            step_id: "ST1",
            title: "Split work",
            display_description: "Prepare the DAG",
            codex_description: "Prepare the DAG",
            success_criteria: "DAG exists",
            reasoning_effort: "medium",
            depends_on: [],
            owned_paths: ["src/jakal_flow/planning.py"],
            status: "completed",
          },
          {
            step_id: "ST2",
            title: "Desktop",
            display_description: "Render the desktop flow",
            codex_description: "Render the desktop flow",
            success_criteria: "Desktop flow renders",
            reasoning_effort: "high",
            depends_on: ["ST1"],
            owned_paths: ["desktop/src"],
            status: "pending",
          },
          {
            step_id: "ST3",
            title: "Backend",
            display_description: "Update the backend",
            codex_description: "Update the backend",
            success_criteria: "Backend saves the DAG",
            reasoning_effort: "high",
            depends_on: ["ST1"],
            owned_paths: ["src/jakal_flow"],
            status: "pending",
          },
        ],
      },
      selectedStepId: "ST2",
    }),
  );

  assert.match(html, /Execution Tree/);
  assert.match(html, /Ready Nodes/);
  assert.match(html, /Depends On/);
  assert.match(html, /Owned Paths/);
  assert.doesNotMatch(html, /Flow Chart/);
});

test("IdeToolbar renders the active command and DAG-ready progress text", async () => {
  const module = await importBundledModule(
    "ide-toolbar-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { IdeToolbar } from "./src/components/layout/IdeToolbar.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(IdeToolbar, props))
        );
      }
    `,
  );

  const html = module.renderComponent({
    projectDetail: {
      project: {
        display_name: "Demo",
        current_status: "plan_ready",
      },
    },
    planDraft: {
      execution_mode: "parallel",
      closeout_status: "not_started",
      steps: [
        { step_id: "ST1", status: "completed" },
        { step_id: "ST2", status: "pending", depends_on: ["ST1"], owned_paths: ["desktop/src"] },
        { step_id: "ST3", status: "pending", depends_on: ["ST1"], owned_paths: ["src/jakal_flow"] },
      ],
    },
    busy: true,
    activeJob: {
      status: "running",
      command: "run-plan",
    },
    activeCenterTab: "run",
    onRefresh: noop,
    onOpenSettings: noop,
    onGeneratePlan: noop,
    onRunPlan: noop,
    onRunCloseout: noop,
  });

  assert.match(html, /Run Remaining Steps/);
  assert.match(html, /Completed 1\/3 steps, ready: ST2, ST3/);
  assert.match(html, /Program Settings/);
});

test("IdeToolbar prioritizes the debugging status over the generic active command", async () => {
  const module = await importBundledModule(
    "ide-toolbar-debugging-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { IdeToolbar } from "./src/components/layout/IdeToolbar.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(IdeToolbar, props))
        );
      }
    `,
  );

  const html = module.renderComponent({
    projectDetail: {
      project: {
        display_name: "Demo",
        current_status: "running:debugging",
      },
    },
    planDraft: {
      execution_mode: "serial",
      closeout_status: "not_started",
      steps: [
        { step_id: "ST1", status: "completed" },
        { step_id: "ST2", status: "running" },
      ],
    },
    busy: true,
    activeJob: {
      status: "running",
      command: "run-plan",
    },
    activeCenterTab: "run",
    onRefresh: noop,
    onOpenSettings: noop,
    onGeneratePlan: noop,
    onRunPlan: noop,
    onRunCloseout: noop,
  });

  assert.match(html, /Debugging/);
});

test("RunProgressPanel renders current work, progress, and recent activity", async () => {
  const module = await importBundledModule(
    "run-progress-panel-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { RunProgressPanel } from "./src/components/layout/RunProgressPanel.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(RunProgressPanel, props))
        );
      }
    `,
  );

  const html = module.renderComponent({
    detail: {
      project: {
        current_status: "running:block:2",
      },
      activity: [
        "2026-03-26T09:01:00Z | step-started [ST2] | Running ST2: Build the screen",
      ],
      plan: {
        execution_mode: "parallel",
        closeout_status: "not_started",
        steps: [
          { step_id: "ST1", title: "Plan", status: "completed" },
          { step_id: "ST2", title: "Build", status: "running", depends_on: ["ST1"], owned_paths: ["desktop/src"] },
          { step_id: "ST3", title: "Backend", status: "pending", depends_on: ["ST1"], owned_paths: ["src/jakal_flow"] },
        ],
      },
      stats: {
        total_steps: 3,
        completed_steps: 1,
        failed_steps: 0,
        running_steps: 1,
        remaining_steps: 2,
      },
    },
    planDraft: {
      execution_mode: "parallel",
      closeout_status: "not_started",
      steps: [
        { step_id: "ST1", title: "Plan", status: "completed" },
        { step_id: "ST2", title: "Build", status: "running", depends_on: ["ST1"], owned_paths: ["desktop/src"] },
        { step_id: "ST3", title: "Backend", status: "pending", depends_on: ["ST1"], owned_paths: ["src/jakal_flow"] },
      ],
    },
    activeJob: {
      status: "running",
      command: "run-plan",
    },
  });

  assert.match(html, /Live Run/);
  assert.match(html, /Working on ST2 - Build/);
  assert.match(html, /Completed 1\/3 steps, ready: ST2, ST3/);
  assert.match(html, /Running ST2: Build the screen/);
});

test("RunProgressPanel renders debugging state from the project status", async () => {
  const module = await importBundledModule(
    "run-progress-panel-debugging-render",
    `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { I18nProvider } from "./src/i18n.jsx";
      import { RunProgressPanel } from "./src/components/layout/RunProgressPanel.jsx";

      export function renderComponent(props) {
        return renderToStaticMarkup(
          React.createElement(I18nProvider, { initialLanguage: "en" }, React.createElement(RunProgressPanel, props))
        );
      }
    `,
  );

  const html = module.renderComponent({
    detail: {
      project: {
        current_status: "running:debugging",
      },
      activity: [
        "debugger | debugger_invoked | Debugging ST2 - Build | python -m pytest exited with 1",
      ],
      plan: {
        execution_mode: "serial",
        closeout_status: "not_started",
        steps: [
          { step_id: "ST1", title: "Plan", status: "completed" },
          { step_id: "ST2", title: "Build", status: "running" },
        ],
      },
      stats: {
        total_steps: 2,
        completed_steps: 1,
        failed_steps: 0,
        running_steps: 1,
        remaining_steps: 1,
      },
    },
    planDraft: {
      execution_mode: "serial",
      closeout_status: "not_started",
      steps: [
        { step_id: "ST1", title: "Plan", status: "completed" },
        { step_id: "ST2", title: "Build", status: "running" },
      ],
    },
    activeJob: {
      status: "running",
      command: "run-plan",
    },
  });

  assert.match(html, /Debugging/);
  assert.match(html, /python -m pytest exited with 1/);
  assert.doesNotMatch(html, /Working on ST2 - Build/);
});
