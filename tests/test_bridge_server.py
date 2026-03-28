from __future__ import annotations

from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from jakal_flow.bridge_server import BridgeJobStore
from jakal_flow.utils import read_json, read_jsonl


class BridgeJobStoreTests(unittest.TestCase):
    def test_create_queues_excess_jobs_and_persists_scheduler_state(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace_root = Path(temp_dir) / "workspace"
            published: list[dict] = []
            store = BridgeJobStore(lambda envelope: published.append(envelope.to_dict()), max_running_jobs=1)

            running = store.create("run-plan", workspace_root, {"project_dir": str(workspace_root / "repo-a")})
            queued = store.create("run-plan", workspace_root, {"project_dir": str(workspace_root / "repo-b")})

            self.assertEqual(running.status, "running")
            self.assertEqual(queued.status, "queued")
            self.assertEqual(queued.queue_position, 1)

            state = read_json(workspace_root / "job_scheduler.json", default={}) or {}
            self.assertEqual(state.get("max_concurrent_jobs"), 1)
            self.assertEqual([item.get("status") for item in state.get("jobs", [])], ["running", "queued"])
            self.assertEqual([item.get("queue_position") for item in state.get("jobs", [])], [0, 1])

            events = read_jsonl(workspace_root / "job_scheduler_events.jsonl")
            self.assertEqual([item.get("event_type") for item in events], ["job-started", "job-queued"])
            self.assertTrue(any(item.get("payload", {}).get("job", {}).get("status") == "queued" for item in published))

    def test_duplicate_project_jobs_are_rejected_and_queued_jobs_start_after_completion(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace_root = Path(temp_dir) / "workspace"
            store = BridgeJobStore(lambda _envelope: None, max_running_jobs=1)

            repo_a = str(workspace_root / "repo-a")
            repo_b = str(workspace_root / "repo-b")
            first = store.create("run-plan", workspace_root, {"project_dir": repo_a})
            second = store.create("run-plan", workspace_root, {"project_dir": repo_b})

            with self.assertRaisesRegex(RuntimeError, "already active for this project"):
                store.create("run-plan", workspace_root, {"project_dir": repo_a})

            store.update(first.id, status="completed", error=None, result={})
            promoted = store.dequeue_startable_jobs(workspace_root)

            self.assertEqual(len(promoted), 1)
            self.assertEqual(promoted[0].id, second.id)
            self.assertEqual(promoted[0].status, "running")
            self.assertEqual(promoted[0].queue_position, 0)

            state = read_json(workspace_root / "job_scheduler.json", default={}) or {}
            self.assertEqual(len(state.get("jobs", [])), 1)
            self.assertEqual(state["jobs"][0]["id"], second.id)
            self.assertEqual(state["jobs"][0]["status"], "running")

    def test_create_uses_unique_ids_even_with_same_timestamp(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            workspace_root = Path(temp_dir) / "workspace"
            store = BridgeJobStore(lambda _envelope: None, max_running_jobs=1)

            with patch("jakal_flow.bridge_server.now_ms", return_value=1234567890):
                first = store.create("run-plan", workspace_root, {"project_dir": str(workspace_root / "repo-a")})
                second = store.create("run-plan", workspace_root, {"project_dir": str(workspace_root / "repo-b")})

            self.assertNotEqual(first.id, second.id)

            state = read_json(workspace_root / "job_scheduler.json", default={}) or {}
            self.assertEqual([item.get("status") for item in state.get("jobs", [])], ["running", "queued"])


if __name__ == "__main__":
    unittest.main()
