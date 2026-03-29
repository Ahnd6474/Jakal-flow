from __future__ import annotations

from pathlib import Path
import shutil
import sys
import unittest
from unittest import mock
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from jakal_flow.bridge_server import BridgeServer


def local_temp_root() -> Path:
    root = Path(__file__).resolve().parents[1] / ".tub"
    root.mkdir(parents=True, exist_ok=True)
    return root


class TemporaryTestDir:
    def __enter__(self) -> Path:
        self.path = local_temp_root() / f"bridge-{uuid.uuid4().hex[:8]}"
        self.path.mkdir(parents=True, exist_ok=True)
        return self.path

    def __exit__(self, exc_type, exc, tb) -> None:
        shutil.rmtree(self.path, ignore_errors=True)


class CaptureBridgeServer(BridgeServer):
    def __init__(self) -> None:
        self.envelopes: list[dict] = []
        super().__init__()

    def _send_envelope(self, envelope) -> None:
        self.envelopes.append(envelope.to_dict())


class BridgeServerTests(unittest.TestCase):
    def test_bridge_request_skips_project_changed_event_when_result_disables_it(self) -> None:
        with TemporaryTestDir() as workspace_root:
            server = CaptureBridgeServer()

            with mock.patch(
                "jakal_flow.bridge_server.run_command",
                return_value={"chat": {"messages": []}, "emit_project_changed": False},
            ):
                server._handle_request(
                    "req-1",
                    "bridge_request",
                    {
                        "command": "load-project-chat",
                        "workspace_root": str(workspace_root),
                        "payload": {},
                    },
                )

            response_events = [item for item in server.envelopes if item.get("kind") == "response"]
            project_events = [item for item in server.envelopes if item.get("event") == "project.changed"]
            self.assertEqual(len(response_events), 1)
            self.assertEqual(project_events, [])

    def test_background_job_skips_project_changed_event_when_result_disables_it(self) -> None:
        with TemporaryTestDir() as workspace_root:
            workspace_root.mkdir(parents=True, exist_ok=True)
            repo_dir = workspace_root / "repo"
            repo_dir.mkdir(parents=True, exist_ok=True)
            server = CaptureBridgeServer()

            snapshot = server._jobs.create(
                "send-chat-message",
                workspace_root,
                {"project_dir": str(repo_dir)},
            )
            server.envelopes.clear()

            with mock.patch(
                "jakal_flow.bridge_server.run_command",
                return_value={"chat": {"messages": []}, "emit_project_changed": False},
            ):
                server._run_job(
                    snapshot.id,
                    "send-chat-message",
                    workspace_root,
                    {"project_dir": str(repo_dir)},
                )

            project_events = [item for item in server.envelopes if item.get("event") == "project.changed"]
            job_updates = [item for item in server.envelopes if item.get("event") == "job.updated"]
            self.assertEqual(project_events, [])
            self.assertTrue(job_updates)
            self.assertEqual(job_updates[-1]["payload"]["job"]["status"], "completed")
