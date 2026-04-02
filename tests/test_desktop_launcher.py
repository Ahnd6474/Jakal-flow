from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow import desktop


class DesktopLauncherTests(unittest.TestCase):
    def test_command_for_action_strips_separator_and_uses_script_mapping(self) -> None:
        with mock.patch("jakal_flow.desktop.npm_executable", return_value="npm"):
            command = desktop.command_for_action("dev", ["--", "--verbose"])

        self.assertEqual(command, ["npm", "run", "tauri:dev", "--verbose"])

    def test_command_for_action_rejects_unknown_action(self) -> None:
        with self.assertRaisesRegex(ValueError, "Unsupported desktop action"):
            desktop.command_for_action("ship", [])

    def test_main_runs_from_desktop_root(self) -> None:
        completed = subprocess.CompletedProcess(["npm", "run", "test"], 0)

        with mock.patch("jakal_flow.desktop.desktop_root", return_value=Path("D:/repo/desktop")), mock.patch(
            "pathlib.Path.is_dir",
            return_value=True,
        ), mock.patch("jakal_flow.desktop.command_for_action", return_value=["npm", "run", "test"]) as command_mock, mock.patch(
            "jakal_flow.desktop.subprocess.run",
            return_value=completed,
        ) as run_mock:
            code = desktop.main(["test"])

        self.assertEqual(code, 0)
        command_mock.assert_called_once_with("test", [])
        run_mock.assert_called_once_with(["npm", "run", "test"], cwd=Path("D:/repo/desktop"), check=False)
