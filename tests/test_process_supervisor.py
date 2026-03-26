from __future__ import annotations

import subprocess
import unittest
from unittest import mock

from jakal_flow.process_supervisor import hidden_window_startupinfo


class ProcessSupervisorTests(unittest.TestCase):
    @mock.patch("jakal_flow.process_supervisor.os.name", "posix")
    def test_hidden_window_startupinfo_returns_none_off_windows(self) -> None:
        self.assertIsNone(hidden_window_startupinfo())

    @mock.patch("jakal_flow.process_supervisor.os.name", "nt")
    def test_hidden_window_startupinfo_hides_windows_console(self) -> None:
        if not hasattr(subprocess, "STARTUPINFO"):
            self.skipTest("Windows startupinfo is unavailable on this platform.")
        startupinfo = hidden_window_startupinfo()
        self.assertIsNotNone(startupinfo)
        assert startupinfo is not None
        self.assertTrue(startupinfo.dwFlags & getattr(subprocess, "STARTF_USESHOWWINDOW", 0))
        self.assertEqual(startupinfo.wShowWindow, getattr(subprocess, "SW_HIDE", 0))


if __name__ == "__main__":
    unittest.main()
