import json
import mimetypes
import os
import tempfile
import threading
from copy import deepcopy
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_STATUSES = ("idle", "planning", "coding", "reviewing")
DEFAULT_AGENT_IDS = ("manager", "job", "local-smoke")
LEGACY_AGENT_IDS = ("agent-alpha", "agent-beta", "agent-gamma", "agent-delta")
LEGACY_AGENT_ID_MAP = {
    "agent-alpha": "manager",
    "agent-beta": "job",
    "agent-gamma": "local-smoke",
}


def utc_now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def build_history_entry(status, summary, result="No result yet", at=None):
    return {
        "at": at or utc_now_iso(),
        "status": status,
        "summary": summary,
        "result": result,
    }


def build_default_state():
    updated_at = utc_now_iso()
    return {
        "version": "0.3",
        "office": {
            "name": "Local Agent Office",
            "subtitle": "Readable desks for manager, job, and local-smoke",
            "statuses": list(DEFAULT_STATUSES),
        },
        "agents": [
            {
                "id": "manager",
                "name": "Manager",
                "emoji": "🛠",
                "status": "planning",
                "seat": "Window Desk",
                "role": "Coordinator",
                "current_task": "Inspect project layout and break work into clear next steps.",
                "result_summary": "Waiting to publish the next execution update.",
                "history": [
                    build_history_entry(
                        "planning",
                        "Opened the local workspace and reviewed project files.",
                        "Plan ready for the next implementation cycle.",
                        updated_at,
                    )
                ],
                "updated_at": updated_at,
            },
            {
                "id": "job",
                "name": "Job",
                "emoji": "⚙️",
                "status": "coding",
                "seat": "Build Bench",
                "role": "Executor",
                "current_task": "Run the active implementation step assigned by manager.",
                "result_summary": "Latest code output has not been recorded yet.",
                "history": [
                    build_history_entry(
                        "coding",
                        "Picked up the current implementation ticket.",
                        "Work is in progress.",
                        updated_at,
                    )
                ],
                "updated_at": updated_at,
            },
            {
                "id": "local-smoke",
                "name": "Local Smoke",
                "emoji": "🧪",
                "status": "reviewing",
                "seat": "Test Console",
                "role": "Verifier",
                "current_task": "Watch for quick local smoke checks and report breakage fast.",
                "result_summary": "No smoke result captured yet.",
                "history": [
                    build_history_entry(
                        "reviewing",
                        "Prepared to validate the latest local changes.",
                        "Awaiting the next smoke run.",
                        updated_at,
                    )
                ],
                "updated_at": updated_at,
            },
        ],
        "updated_at": updated_at,
    }


class StateStoreError(Exception):
    pass


class StateStore:
    def __init__(self, path):
        self.path = Path(path)
        self.lock = threading.Lock()

    def ensure_initialized(self):
        with self.lock:
            if self.path.exists():
                return
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self._write_unlocked(build_default_state())

    def read_state(self):
        self.ensure_initialized()
        with self.lock:
            try:
                with self.path.open("r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError) as exc:
                raise StateStoreError(f"Unable to read state file: {exc}") from exc
            state = self._normalize_state(data)
            if self._is_legacy_state(data):
                self._write_unlocked(state)
        return state

    def upsert_agent(self, payload):
        self.ensure_initialized()
        with self.lock:
            try:
                with self.path.open("r", encoding="utf-8") as handle:
                    current = json.load(handle)
            except (OSError, json.JSONDecodeError) as exc:
                raise StateStoreError(f"Unable to read state file: {exc}") from exc

            state = self._normalize_state(current)
            agent = self._build_agent_from_payload(state, payload)
            agents = state["agents"]

            for index, existing in enumerate(agents):
                if existing["id"] == agent["id"]:
                    agents[index] = agent
                    break
            else:
                agents.append(agent)

            state["updated_at"] = agent["updated_at"]
            self._write_unlocked(state)
        return deepcopy(state), deepcopy(agent)

    def _normalize_state(self, data):
        if not isinstance(data, dict):
            raise StateStoreError("State payload must be a JSON object.")

        if self._is_legacy_state(data):
            return self._migrate_legacy_state(data)

        state = deepcopy(build_default_state())

        office = data.get("office")
        agents = data.get("agents")

        if isinstance(office, dict):
            state["office"].update(
                {
                    key: office[key]
                    for key in ("name", "subtitle")
                    if isinstance(office.get(key), str)
                }
            )

        normalized_agents = []
        if isinstance(agents, list):
            for item in agents:
                if not isinstance(item, dict):
                    continue
                try:
                    normalized_agents.append(self._normalize_agent(item))
                except ValueError:
                    continue

        if normalized_agents:
            state["agents"] = normalized_agents

        updated_at = data.get("updated_at")
        if isinstance(updated_at, str) and updated_at.strip():
            state["updated_at"] = updated_at.strip()

        return state

    def _migrate_legacy_state(self, data):
        state = deepcopy(build_default_state())
        updated_at = data.get("updated_at")
        if isinstance(updated_at, str) and updated_at.strip():
            state["updated_at"] = updated_at.strip()

        legacy_agents = data.get("agents")
        if not isinstance(legacy_agents, list):
            return state

        migrated = {agent["id"]: agent for agent in state["agents"]}
        used_target_ids = set()

        for item in legacy_agents:
            if not isinstance(item, dict):
                continue

            legacy_id = str(item.get("id") or "").strip()
            target_id = LEGACY_AGENT_ID_MAP.get(legacy_id)
            if target_id is None:
                target_id = next(
                    (agent_id for agent_id in DEFAULT_AGENT_IDS if agent_id not in used_target_ids),
                    None,
                )

            if target_id not in migrated or target_id in used_target_ids:
                continue
            used_target_ids.add(target_id)

            default_agent = migrated[target_id]
            status = str(item.get("status") or default_agent["status"]).strip().lower()
            if status not in DEFAULT_STATUSES:
                status = default_agent["status"]

            agent_updated_at = str(item.get("updated_at") or state["updated_at"]).strip() or state["updated_at"]
            current_task = (
                str(
                    item.get("current_task")
                    or item.get("task")
                    or item.get("note")
                    or default_agent["current_task"]
                ).strip()
                or default_agent["current_task"]
            )
            result_summary = (
                str(item.get("result_summary") or item.get("result") or default_agent["result_summary"]).strip()
                or default_agent["result_summary"]
            )

            migrated[target_id] = {
                **default_agent,
                "status": status,
                "current_task": current_task,
                "result_summary": result_summary,
                "history": self._normalize_history(
                    item.get("history"),
                    status,
                    current_task,
                    result_summary,
                    agent_updated_at,
                ),
                "updated_at": agent_updated_at,
            }

        state["agents"] = [migrated[agent_id] for agent_id in DEFAULT_AGENT_IDS]
        return state

    def _is_legacy_state(self, data):
        if not isinstance(data, dict):
            return False

        version = str(data.get("version") or "").strip()
        if version == "0.2":
            return True

        agents = data.get("agents")
        if not isinstance(agents, list) or not agents:
            return False

        agent_ids = {
            str(item.get("id") or "").strip()
            for item in agents
            if isinstance(item, dict)
        }
        office = data.get("office")
        office_name = ""
        if isinstance(office, dict):
            office_name = str(office.get("name") or "").strip()

        return bool(agent_ids & set(LEGACY_AGENT_IDS)) or office_name == "Pixel Office Dashboard"

    def _normalize_agent(self, item):
        agent_id = str(item.get("id", "")).strip()
        name = str(item.get("name", "")).strip()
        status = str(item.get("status", "")).strip().lower()
        if not agent_id or not name:
            raise ValueError("Agent requires id and name.")
        if status not in DEFAULT_STATUSES:
            raise ValueError("Invalid status.")
        updated_at = str(item.get("updated_at") or utc_now_iso()).strip()
        emoji = str(item.get("emoji") or "🙂").strip() or "🙂"
        seat = str(item.get("seat") or self._default_seat(agent_id)).strip()
        role = str(item.get("role") or self._default_role(agent_id)).strip()
        current_task = str(item.get("current_task") or "No active task recorded.").strip()
        result_summary = str(item.get("result_summary") or "No result recorded.").strip()
        history = self._normalize_history(item.get("history"), status, current_task, result_summary, updated_at)
        return {
            "id": agent_id,
            "name": name,
            "emoji": emoji,
            "status": status,
            "seat": seat,
            "role": role,
            "current_task": current_task,
            "result_summary": result_summary,
            "history": history,
            "updated_at": updated_at,
        }

    def _build_agent_from_payload(self, state, payload):
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a JSON object.")

        agent_id = str(payload.get("agent_id", "")).strip()
        if not agent_id:
            raise ValueError("Field 'agent_id' is required.")

        existing = next((agent for agent in state["agents"] if agent["id"] == agent_id), None)
        name = payload.get("name")
        status = payload.get("status")
        updated_at = payload.get("updated_at")
        emoji = payload.get("emoji")
        seat = payload.get("seat")
        role = payload.get("role")
        current_task = payload.get("current_task")
        result_summary = payload.get("result_summary")
        history = payload.get("history")
        history_entry = payload.get("history_entry")
        note = payload.get("note")

        if existing is None and not isinstance(name, str):
            raise ValueError("New agents require field 'name'.")

        normalized_name = (
            name.strip()
            if isinstance(name, str) and name.strip()
            else (existing["name"] if existing else "")
        )
        if not normalized_name:
            raise ValueError("Field 'name' must be a non-empty string.")

        normalized_status = (
            status.strip().lower()
            if isinstance(status, str) and status.strip()
            else (existing["status"] if existing else "")
        )
        if normalized_status not in DEFAULT_STATUSES:
            raise ValueError(
                f"Field 'status' must be one of: {', '.join(DEFAULT_STATUSES)}."
            )

        normalized_updated_at = (
            updated_at.strip()
            if isinstance(updated_at, str) and updated_at.strip()
            else utc_now_iso()
        )
        normalized_emoji = (
            emoji.strip()
            if isinstance(emoji, str) and emoji.strip()
            else (existing["emoji"] if existing else "🙂")
        )
        normalized_seat = (
            seat.strip()
            if isinstance(seat, str) and seat.strip()
            else (existing["seat"] if existing else self._default_seat(agent_id))
        )
        normalized_role = (
            role.strip()
            if isinstance(role, str) and role.strip()
            else (existing["role"] if existing else self._default_role(agent_id))
        )
        normalized_task = (
            current_task.strip()
            if isinstance(current_task, str) and current_task.strip()
            else (existing["current_task"] if existing else "No active task recorded.")
        )
        normalized_result = (
            result_summary.strip()
            if isinstance(result_summary, str) and result_summary.strip()
            else (existing["result_summary"] if existing else "No result recorded.")
        )
        normalized_history = self._build_history_for_update(
            existing=existing,
            history=history,
            history_entry=history_entry,
            status=normalized_status,
            current_task=normalized_task,
            result_summary=normalized_result,
            updated_at=normalized_updated_at,
            note=note,
        )

        return {
            "id": agent_id,
            "name": normalized_name,
            "emoji": normalized_emoji,
            "status": normalized_status,
            "seat": normalized_seat,
            "role": normalized_role,
            "current_task": normalized_task,
            "result_summary": normalized_result,
            "history": normalized_history,
            "updated_at": normalized_updated_at,
        }

    def _default_seat(self, agent_id):
        return {
            "manager": "Window Desk",
            "job": "Build Bench",
            "local-smoke": "Test Console",
        }.get(agent_id, "Open Seat")

    def _default_role(self, agent_id):
        return {
            "manager": "Coordinator",
            "job": "Executor",
            "local-smoke": "Verifier",
        }.get(agent_id, "Agent")

    def _normalize_history(self, history, status, current_task, result_summary, updated_at):
        normalized = []
        if isinstance(history, list):
            for entry in history:
                if not isinstance(entry, dict):
                    continue
                entry_status = str(entry.get("status") or status).strip().lower()
                if entry_status not in DEFAULT_STATUSES:
                    continue
                summary = str(entry.get("summary") or current_task).strip()
                result = str(entry.get("result") or result_summary).strip()
                at = str(entry.get("at") or updated_at or utc_now_iso()).strip()
                if not summary:
                    continue
                normalized.append(
                    {
                        "at": at,
                        "status": entry_status,
                        "summary": summary,
                        "result": result or "No result recorded.",
                    }
                )

        if not normalized:
            normalized.append(
                build_history_entry(
                    status,
                    current_task or "No active task recorded.",
                    result_summary or "No result recorded.",
                    updated_at,
                )
            )

        return normalized[:8]

    def _build_history_for_update(
        self,
        existing,
        history,
        history_entry,
        status,
        current_task,
        result_summary,
        updated_at,
        note,
    ):
        if isinstance(history, list):
            return self._normalize_history(
                history,
                status,
                current_task,
                result_summary,
                updated_at,
            )

        if isinstance(history_entry, dict):
            manual_entry = {
                "status": history_entry.get("status", status),
                "summary": history_entry.get("summary", current_task),
                "result": history_entry.get("result", result_summary),
                "at": history_entry.get("at", updated_at),
            }
            base_history = existing["history"] if existing else []
            return self._normalize_history(
                [manual_entry, *base_history],
                status,
                current_task,
                result_summary,
                updated_at,
            )

        base_history = list(existing["history"]) if existing else []
        summary = (
            note.strip()
            if isinstance(note, str) and note.strip()
            else current_task
        )
        auto_entry = build_history_entry(status, summary, result_summary, updated_at)
        return self._normalize_history(
            [auto_entry, *base_history],
            status,
            current_task,
            result_summary,
            updated_at,
        )

    def _write_unlocked(self, state):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=self.path.parent,
            delete=False,
        ) as handle:
            json.dump(state, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            temp_name = handle.name
        os.replace(temp_name, self.path)


def build_runtime_config():
    host = os.getenv("APP_HOST", "0.0.0.0")
    port = int(os.getenv("APP_PORT", os.getenv("CONTAINER_PORT", "3000")))
    poll_interval_ms = int(os.getenv("STATE_POLL_INTERVAL_MS", "5000"))
    state_file = os.getenv("APP_STATE_FILE", str(BASE_DIR / "state.json"))
    return {
        "host": host,
        "port": port,
        "poll_interval_ms": max(1000, poll_interval_ms),
        "state_store": StateStore(state_file),
        "template_dir": BASE_DIR / "templates",
        "static_dir": BASE_DIR / "static",
    }


def render_template(template_path, context):
    content = template_path.read_text(encoding="utf-8")
    for key, value in context.items():
        content = content.replace(f"{{{{{key}}}}}", str(value))
    return content.encode("utf-8")


def create_app_handler(config):
    state_store = config["state_store"]
    template_dir = config["template_dir"]
    static_dir = config["static_dir"]
    poll_interval_ms = config["poll_interval_ms"]

    class AppHandler(BaseHTTPRequestHandler):
        server_version = "OfficeDashboard/0.3"

        def do_GET(self):
            parsed = urlparse(self.path)

            if parsed.path == "/":
                self._handle_home()
                return

            if parsed.path == "/health":
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "status": "ok",
                    },
                )
                return

            if parsed.path == "/api/state":
                self._handle_get_state()
                return

            if parsed.path.startswith("/static/"):
                self._handle_static(parsed.path)
                return

            self._send_json(
                HTTPStatus.NOT_FOUND,
                {
                    "error": "Not found",
                },
            )

        def do_POST(self):
            parsed = urlparse(self.path)
            if parsed.path == "/api/state":
                self._handle_post_state()
                return

            self._send_json(
                HTTPStatus.NOT_FOUND,
                {
                    "error": "Not found",
                },
            )

        def log_message(self, format, *args):
            print(
                '%s - - [%s] %s'
                % (self.address_string(), self.log_date_time_string(), format % args)
            )

        def _handle_home(self):
            template_path = template_dir / "index.html"
            if not template_path.exists():
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {
                        "error": "Template missing",
                    },
                )
                return

            body = render_template(
                template_path,
                {
                    "title": "Agent Workstations v0.3",
                    "poll_interval_ms": poll_interval_ms,
                },
            )
            self._send_bytes(HTTPStatus.OK, body, "text/html; charset=utf-8")

        def _handle_get_state(self):
            try:
                state = state_store.read_state()
            except StateStoreError as exc:
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {
                        "error": "State unavailable",
                        "detail": str(exc),
                    },
                )
                return

            self._send_json(HTTPStatus.OK, state)

        def _handle_post_state(self):
            try:
                payload = self._read_json_body()
            except ValueError as exc:
                self._send_json(
                    HTTPStatus.BAD_REQUEST,
                    {
                        "error": "Invalid JSON payload",
                        "detail": str(exc),
                    },
                )
                return

            try:
                state, agent = state_store.upsert_agent(payload)
            except ValueError as exc:
                self._send_json(
                    HTTPStatus.BAD_REQUEST,
                    {
                        "error": "Invalid state update",
                        "detail": str(exc),
                    },
                )
                return
            except StateStoreError as exc:
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {
                        "error": "Failed to persist state",
                        "detail": str(exc),
                    },
                )
                return

            self._send_json(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "agent": agent,
                    "state": state,
                },
            )

        def _handle_static(self, path):
            file_path = (static_dir / path.removeprefix("/static/")).resolve()
            if not str(file_path).startswith(str(static_dir.resolve())) or not file_path.is_file():
                self._send_json(
                    HTTPStatus.NOT_FOUND,
                    {
                        "error": "Not found",
                    },
                )
                return

            try:
                body = file_path.read_bytes()
            except OSError:
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {
                        "error": "Failed to read static asset",
                    },
                )
                return

            content_type, _ = mimetypes.guess_type(str(file_path))
            self._send_bytes(
                HTTPStatus.OK,
                body,
                content_type or "application/octet-stream",
            )

        def _read_json_body(self):
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            if not raw_body:
                raise ValueError("Request body is empty.")
            try:
                return json.loads(raw_body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                raise ValueError("Body must be valid UTF-8 JSON.") from exc

        def _send_json(self, status_code, payload):
            body = json.dumps(payload).encode("utf-8")
            self._send_bytes(status_code, body, "application/json; charset=utf-8")

        def _send_bytes(self, status_code, body, content_type):
            self.send_response(status_code)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return AppHandler


def run():
    config = build_runtime_config()
    config["state_store"].ensure_initialized()
    server = ThreadingHTTPServer(
        (config["host"], config["port"]),
        create_app_handler(config),
    )
    print(
        "Starting lightweight office dashboard on "
        f"http://{config['host']}:{config['port']}"
    )
    server.serve_forever()


if __name__ == "__main__":
    run()
