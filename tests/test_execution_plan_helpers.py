from __future__ import annotations

import unittest
from pathlib import Path
import shutil
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from codex_auto.environment import ensure_gitignore
from codex_auto.models import ExecutionStep
from codex_auto.planning import (
    PLAN_GENERATION_PROMPT_FILENAME,
    STEP_EXECUTION_PROMPT_FILENAME,
    execution_plan_svg,
    load_source_prompt_template,
    parse_execution_plan_response,
    source_prompt_template_path,
)


class ExecutionPlanHelperTests(unittest.TestCase):
    def test_parse_execution_plan_response_reads_json_tasks(self) -> None:
        response = """
        {
          "title": "CLI rollout",
          "summary": "Build the feature in small verified steps.",
          "tasks": [
            {
              "task_title": "Add the CLI flag",
              "display_description": "Expose the new flag to users.",
              "codex_description": "Inspect the CLI parser, add the flag, and cover it with tests.",
              "success_criteria": "CLI parsing succeeds."
            },
            {
              "task_title": "Wire the backend",
              "display_description": "Connect the new option to execution.",
              "codex_description": "Review the execution path, add targeted tests, and wire the backend.",
              "success_criteria": "Backend path is covered."
            }
          ]
        }
        """
        plan_title, summary, steps = parse_execution_plan_response(response, "python -m unittest", limit=4)

        self.assertEqual(plan_title, "CLI rollout")
        self.assertEqual(summary, "Build the feature in small verified steps.")
        self.assertEqual(len(steps), 2)
        self.assertEqual(steps[0].step_id, "LT1")
        self.assertEqual(steps[0].display_description, "Expose the new flag to users.")
        self.assertIn("CLI parser", steps[0].codex_description)
        self.assertEqual(steps[0].test_command, "python -m unittest")
        self.assertEqual(steps[1].step_id, "LT2")
        self.assertEqual(steps[1].test_command, "python -m unittest")

    def test_execution_step_from_dict_accepts_legacy_description(self) -> None:
        step = ExecutionStep.from_dict(
            {
                "step_id": "LT1",
                "title": "Legacy task",
                "description": "Old UI description",
                "success_criteria": "Still works.",
            }
        )

        self.assertEqual(step.display_description, "Old UI description")
        self.assertEqual(step.codex_description, "Old UI description")
        self.assertEqual(step.success_criteria, "Still works.")

    def test_execution_plan_svg_includes_step_statuses(self) -> None:
        svg = execution_plan_svg(
            "demo flow",
            [
                ExecutionStep(step_id="LT1", title="First", test_command="pytest a", status="completed"),
                ExecutionStep(step_id="LT2", title="Second", test_command="pytest b", status="pending"),
            ],
        )

        self.assertIn("<svg", svg)
        self.assertIn("demo flow", svg)
        self.assertIn("LT1", svg)
        self.assertIn("LT2", svg)
        self.assertIn("#0f766e", svg)
        self.assertIn("#cbd5e1", svg)

    def test_source_prompt_templates_exist_and_keep_expected_placeholders(self) -> None:
        plan_template = load_source_prompt_template(PLAN_GENERATION_PROMPT_FILENAME)
        step_template = load_source_prompt_template(STEP_EXECUTION_PROMPT_FILENAME)

        self.assertTrue(source_prompt_template_path(PLAN_GENERATION_PROMPT_FILENAME).exists())
        self.assertTrue(source_prompt_template_path(STEP_EXECUTION_PROMPT_FILENAME).exists())
        self.assertIn("{repo_dir}", plan_template)
        self.assertIn("{user_prompt}", plan_template)
        self.assertIn("{max_steps}", plan_template)
        self.assertIn("{task_title}", step_template)
        self.assertIn("{display_description}", step_template)
        self.assertIn("{codex_description}", step_template)
        self.assertIn("{success_criteria}", step_template)

    def test_ensure_gitignore_adds_missing_entries_once(self) -> None:
        project_dir = Path(__file__).resolve().parents[1] / ".tmp_gitignore_test"
        shutil.rmtree(project_dir, ignore_errors=True)
        project_dir.mkdir(parents=True, exist_ok=True)
        gitignore = project_dir / ".gitignore"
        gitignore.write_text("node_modules/\n", encoding="utf-8")

        changed_first = ensure_gitignore(project_dir, entries=[".venv/", "__pycache__/"])
        changed_second = ensure_gitignore(project_dir, entries=[".venv/", "__pycache__/"])
        content = gitignore.read_text(encoding="utf-8")
        shutil.rmtree(project_dir, ignore_errors=True)

        self.assertTrue(changed_first)
        self.assertFalse(changed_second)
        self.assertIn(".venv/", content)
        self.assertIn("__pycache__/", content)


if __name__ == "__main__":
    unittest.main()
