(function () {
  const POLL_INTERVAL_MS = Math.max(
    1000,
    Number(document.body.dataset.pollIntervalMs || 5000)
  );
  const officeName = document.getElementById("office-name");
  const officeSubtitle = document.getElementById("office-subtitle");
  const lastUpdated = document.getElementById("last-updated");
  const summary = document.getElementById("agent-summary");
  const workstationList = document.getElementById("workstation-list");
  const refreshButton = document.getElementById("refresh-button");
  const workingCount = document.getElementById("working-count");
  const workingSummary = document.getElementById("working-summary");
  const latestResultAgent = document.getElementById("latest-result-agent");
  const latestResultText = document.getElementById("latest-result-text");

  function formatTime(value) {
    if (!value) {
      return "Unknown update time";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function isWorking(status) {
    return status === "planning" || status === "coding" || status === "reviewing";
  }

  function clearBoard() {
    summary.innerHTML = "";
    workstationList.innerHTML = "";
  }

  function buildSummaryCard(agent) {
    const node = document.createElement("article");
    node.className = "summary-card";
    node.innerHTML = `
      <div class="agent-name">${agent.emoji || "🙂"} ${agent.name}</div>
      <p class="agent-id">${agent.id}</p>
      <p class="agent-meta-line">${agent.role || "Agent"} · ${agent.seat || "Open Seat"}</p>
      <p><span class="status-pill ${agent.status}">${agent.status}</span></p>
      <p class="agent-time">Updated: ${formatTime(agent.updated_at)}</p>
    `;
    return node;
  }

  function buildHistoryList(agent) {
    const list = document.createElement("div");
    list.className = "history-list";

    const history = Array.isArray(agent.history) ? agent.history : [];
    history.slice(0, 8).forEach((entry) => {
      const item = document.createElement("article");
      item.className = "history-item";
      item.innerHTML = `
        <div class="history-topline">
          <span class="status-pill ${entry.status}">${entry.status}</span>
          <span class="agent-time">${formatTime(entry.at)}</span>
        </div>
        <p class="history-summary">${entry.summary || "No summary recorded."}</p>
        <p class="history-result">${entry.result || "No result recorded."}</p>
      `;
      list.appendChild(item);
    });

    if (list.childElementCount === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No history yet.";
      list.appendChild(empty);
    }

    return list;
  }

  function buildWorkstation(agent) {
    const node = document.createElement("article");
    const workingState = isWorking(agent.status) ? "working" : "idle";
    node.className = `workstation-card ${workingState}`;
    node.innerHTML = `
      <header class="workstation-header">
        <div>
          <p class="seat-label">${agent.seat || "Open Seat"}</p>
          <h2>${agent.emoji || "🙂"} ${agent.name}</h2>
          <p class="agent-meta-line">${agent.role || "Agent"} · ${agent.id}</p>
        </div>
        <div class="presence-box">
          <span class="status-pill ${agent.status}">${agent.status}</span>
          <strong>${workingState === "working" ? "Working" : "Not working"}</strong>
        </div>
      </header>
      <section class="workstation-section">
        <span class="section-label">Current task</span>
        <p class="task-text">${agent.current_task || "No active task recorded."}</p>
      </section>
      <section class="workstation-section">
        <span class="section-label">Result</span>
        <p class="result-text">${agent.result_summary || "No result recorded."}</p>
      </section>
      <section class="workstation-section">
        <span class="section-label">Last update</span>
        <p class="agent-time">${formatTime(agent.updated_at)}</p>
      </section>
      <section class="workstation-section">
        <div class="history-header">
          <span class="section-label">Recent history</span>
          <span class="history-hint">Newest first</span>
        </div>
      </section>
    `;
    node.appendChild(buildHistoryList(agent));
    return node;
  }

  function updateOverview(agents, stateUpdatedAt) {
    const activeAgents = agents.filter((agent) => isWorking(agent.status));
    workingCount.textContent = `${activeAgents.length} active`;
    workingSummary.textContent =
      activeAgents.length > 0
        ? activeAgents.map((agent) => agent.name).join(", ")
        : "No agent is actively working.";

    const sortedByUpdate = [...agents].sort((left, right) => {
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
    });
    const latest = sortedByUpdate[0];

    if (!latest) {
      latestResultAgent.textContent = "No agent yet";
      latestResultText.textContent = "Result feed is empty.";
      return;
    }

    latestResultAgent.textContent = latest.name;
    latestResultText.textContent =
      latest.result_summary || `Updated at ${formatTime(stateUpdatedAt)}.`;
  }

  function renderState(state) {
    clearBoard();

    officeName.textContent = state.office?.name || "Local Agent Office";
    officeSubtitle.textContent =
      state.office?.subtitle || "Readable desks for manager, job, and local-smoke";
    lastUpdated.textContent = `State updated: ${formatTime(state.updated_at)}`;

    const agents = Array.isArray(state.agents) ? state.agents : [];
    agents.forEach((agent) => {
      workstationList.appendChild(buildWorkstation(agent));
      summary.appendChild(buildSummaryCard(agent));
    });
    updateOverview(agents, state.updated_at);
  }

  async function fetchState() {
    const response = await fetch("/api/state", {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`State request failed with ${response.status}`);
    }
    return response.json();
  }

  async function refresh() {
    try {
      const state = await fetchState();
      renderState(state);
    } catch (error) {
      lastUpdated.textContent = `Failed to load state: ${error.message}`;
    }
  }

  refreshButton.addEventListener("click", refresh);
  refresh();
  window.setInterval(refresh, POLL_INTERVAL_MS);
})();
