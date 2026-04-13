import json
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path
from socketserver import TCPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import BASE_DIR, build_runtime_config, create_app_handler


class TestAppHandler(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        config = build_runtime_config()
        config["state_store"] = config["state_store"].__class__(
            Path(cls.temp_dir.name) / "state.json"
        )
        config["template_dir"] = BASE_DIR / "templates"
        config["static_dir"] = BASE_DIR / "static"
        cls.server = TCPServer(("127.0.0.1", 0), create_app_handler(config))
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)
        cls.temp_dir.cleanup()

    def request(self, method, path, body=None, headers=None):
        connection = HTTPConnection("127.0.0.1", self.port, timeout=5)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        payload = response.read()
        content_type = response.getheader("Content-Type", "")
        connection.close()
        return response.status, content_type, payload

    def request_json(self, method, path, body=None):
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        status, content_type, raw = self.request(
            method,
            path,
            body=payload,
            headers={"Content-Type": "application/json"},
        )
        return status, content_type, json.loads(raw.decode("utf-8"))

    def test_homepage(self):
        status, content_type, payload = self.request("GET", "/")
        html = payload.decode("utf-8")
        self.assertEqual(status, 200)
        self.assertIn("text/html", content_type)
        self.assertIn("Agent Workstations", html)
        self.assertIn("/static/app.js", html)

    def test_health(self):
        status, _, payload = self.request_json("GET", "/health")
        self.assertEqual(status, 200)
        self.assertEqual(payload["status"], "ok")

    def test_get_state(self):
        status, _, payload = self.request_json("GET", "/api/state")
        self.assertEqual(status, 200)
        self.assertEqual(payload["version"], "0.3")
        self.assertEqual([agent["id"] for agent in payload["agents"]], ["manager", "job", "local-smoke"])
        self.assertIn("seat", payload["agents"][0])
        self.assertIn("current_task", payload["agents"][0])
        self.assertIn("result_summary", payload["agents"][0])
        self.assertIn("history", payload["agents"][0])
        self.assertIn("updated_at", payload)

    def test_get_state_migrates_legacy_default_board(self):
        legacy_state = {
            "version": "0.2",
            "office": {
                "name": "Pixel Office Dashboard",
                "subtitle": "Lightweight office status board",
                "statuses": ["idle", "planning", "coding", "reviewing"],
            },
            "agents": [
                {"id": "agent-alpha", "name": "Agent Alpha", "status": "planning"},
                {"id": "agent-beta", "name": "Agent Beta", "status": "coding"},
                {"id": "agent-gamma", "name": "Agent Gamma", "status": "reviewing"},
            ],
            "updated_at": "2026-03-27T08:41:24+00:00",
        }
        state_file = Path(self.temp_dir.name) / "state.json"
        state_file.write_text(json.dumps(legacy_state), encoding="utf-8")

        status, _, payload = self.request_json("GET", "/api/state")
        self.assertEqual(status, 200)
        self.assertEqual(payload["version"], "0.3")
        self.assertEqual(
            [agent["name"] for agent in payload["agents"]],
            ["Manager", "Job", "Local Smoke"],
        )
        self.assertEqual(
            [agent["status"] for agent in payload["agents"]],
            ["planning", "coding", "reviewing"],
        )

        stored = json.loads(state_file.read_text(encoding="utf-8"))
        self.assertEqual(stored["version"], "0.3")
        self.assertEqual(
            [agent["id"] for agent in stored["agents"]],
            ["manager", "job", "local-smoke"],
        )
        self.assertEqual(
            [agent["status"] for agent in stored["agents"]],
            ["planning", "coding", "reviewing"],
        )

    def test_post_state_updates_existing_agent(self):
        status, _, payload = self.request_json(
            "POST",
            "/api/state",
            {
                "agent_id": "manager",
                "name": "Manager",
                "status": "coding",
                "updated_at": "2026-03-27T08:00:00+00:00",
                "current_task": "Coordinate the next patch.",
                "result_summary": "Patch queued for review.",
                "note": "Promoted the task from planning to coding.",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["agent"]["status"], "coding")
        self.assertEqual(payload["agent"]["current_task"], "Coordinate the next patch.")
        self.assertEqual(payload["agent"]["history"][0]["summary"], "Promoted the task from planning to coding.")

        status, _, current = self.request_json("GET", "/api/state")
        self.assertEqual(status, 200)
        agent = next(item for item in current["agents"] if item["id"] == "manager")
        self.assertEqual(agent["status"], "coding")
        self.assertEqual(agent["updated_at"], "2026-03-27T08:00:00+00:00")
        self.assertEqual(agent["result_summary"], "Patch queued for review.")

    def test_post_state_creates_new_agent(self):
        status, _, payload = self.request_json(
            "POST",
            "/api/state",
            {
                "agent_id": "audit",
                "name": "Audit",
                "status": "planning",
                "emoji": "🧪",
                "seat": "Overflow Seat",
                "role": "Observer",
                "current_task": "Review logs.",
                "result_summary": "No issues yet.",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(payload["agent"]["id"], "audit")

        status, _, current = self.request_json("GET", "/api/state")
        self.assertEqual(status, 200)
        agent = next(item for item in current["agents"] if item["id"] == "audit")
        self.assertEqual(agent["status"], "planning")
        self.assertEqual(agent["seat"], "Overflow Seat")
        self.assertEqual(agent["history"][0]["summary"], "Review logs.")

    def test_post_state_rejects_invalid_payload(self):
        status, _, payload = self.request_json(
            "POST",
            "/api/state",
            {
                "agent_id": "manager",
                "name": "Manager",
                "status": "sleeping",
            },
        )
        self.assertEqual(status, 400)
        self.assertEqual(payload["error"], "Invalid state update")

    def test_post_state_rejects_invalid_json(self):
        status, _, payload = self.request(
            "POST",
            "/api/state",
            body=b"{invalid",
            headers={"Content-Type": "application/json"},
        )
        data = json.loads(payload.decode("utf-8"))
        self.assertEqual(status, 400)
        self.assertEqual(data["error"], "Invalid JSON payload")

    def test_not_found(self):
        status, _, payload = self.request_json("GET", "/missing")
        self.assertEqual(status, 404)
        self.assertEqual(payload["error"], "Not found")


if __name__ == "__main__":
    unittest.main()
