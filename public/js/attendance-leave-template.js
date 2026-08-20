(() => {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const employeeName = (id) => EMPLOYEES.find((e) => Number(e.employeeId) === Number(id))?.name || "Unknown employee";
  const formatDate = (value) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }) : "—";
  const statusClass = (status) => String(status || "pending").toLowerCase();

  function injectStyles() {
    if (document.getElementById("attendance-leave-template-styles")) return;
    const style = document.createElement("style");
    style.id = "attendance-leave-template-styles";
    style.textContent = `
      #panelLeave.s_panel{padding:16px 14px 20px;background:#fff;border:1px solid #dfe4ea;border-radius:12px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
      .leave-template-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.leave-template-title{font-size:16px;font-weight:800;color:#172033}.leave-template-badge{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#f97316;color:#fff;font-size:12px;font-weight:800}
      .leave-template-card{border:1px solid #d9dee5;border-radius:8px;background:#fff;overflow:hidden}.leave-template-card + .leave-template-card{margin-top:7px}
      .leave-pending-list{padding:0 10px 10px}.leave-pending-row{position:relative;padding:10px 10px 8px 12px;border:1px solid #dfe4ea;border-left:3px solid #22c55e;border-radius:7px;margin-top:7px;background:#fff}.leave-pending-row:first-child{margin-top:0}.leave-person{font-size:11px;font-weight:800;color:#172033}.leave-meta{font-size:8px;color:#667085;margin-top:2px}.leave-actions{display:flex;gap:5px;margin-top:6px}.leave-action{border:0;border-radius:8px;padding:3px 7px;font-size:7px;font-weight:800;cursor:pointer}.leave-action.approve{background:#22c55e;color:#fff}.leave-action.deny{background:#ef4444;color:#fff}.leave-action:disabled{opacity:.55;cursor:wait}
      .leave-all-head{display:flex;align-items:center;justify-content:space-between;margin:18px 0 8px}.leave-all-title{font-size:14px;font-weight:800;color:#172033}.leave-all-count{font-size:9px;color:#667085}.leave-month{font-size:8px;color:#667085;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #dfe4ea;padding:0 2px 4px;margin:12px 0 5px}.leave-history-row{display:grid;grid-template-columns:28px minmax(110px,1.3fr) minmax(80px,1fr) minmax(75px,.9fr) auto;align-items:center;gap:8px;min-height:40px;padding:7px 8px;border:1px solid #e1e5ea;border-radius:7px;margin:4px 0;background:#fff}.leave-avatar{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;background:#8b5cf6;color:#fff;font-size:7px;font-weight:800}.leave-history-name{font-size:8px;font-weight:800;color:#172033}.leave-history-date{font-size:7px;color:#8a93a3;margin-top:2px}.leave-history-reason{font-size:7px;color:#667085}.leave-status{display:inline-flex;align-items:center;justify-content:center;border-radius:9px;padding:3px 6px;font-size:6px;font-weight:800;justify-self:start}.leave-status.pending{background:#fdf0bd;color:#9a6b00}.leave-status.approved{background:#d9f7df;color:#16833b}.leave-status.denied{background:#ffd9d9;color:#c52b2b}.leave-status-btns{display:flex;gap:4px}.leave-small-action{border:0;border-radius:7px;padding:3px 5px;font-size:6px;font-weight:800;cursor:pointer}.leave-small-action.approve{background:#22c55e;color:#fff}.leave-small-action.deny{background:#ef4444;color:#fff}.leave-empty{padding:18px;text-align:center;color:#7b8493;font-size:11px}.leave-template-filters{display:grid;grid-template-columns:1fr 160px auto;gap:7px;margin-bottom:10px}.leave-template-filters input,.leave-template-filters select{width:100%;border:1px solid #d9dee5;border-radius:6px;padding:7px 9px;font-size:9px;background:#fff}.leave-template-reset{border:1px solid #d9dee5;border-radius:6px;background:#fff;padding:6px 9px;font-size:8px;cursor:pointer}@media(max-width:700px){.leave-template-filters{grid-template-columns:1fr}.leave-history-row{grid-template-columns:24px 1fr 1fr}.leave-history-reason{grid-column:2}.leave-status-btns{grid-column:3}}
    `;
    document.head.appendChild(style);
  }

  function render() {
    const panel = document.getElementById("panelLeave");
    if (!panel) return;
    injectStyles();
    const search = (document.getElementById("leaveTemplateSearch")?.value || "").toLowerCase().trim();
    const status = document.getElementById("leaveTemplateStatus")?.value || "all";
    const rows = ALL_LEAVE.filter((request) => {
      const text = `${request.name || employeeName(request.employeeId)} ${request.reason || ""}`.toLowerCase();
      return (!search || text.includes(search)) && (status === "all" || statusClass(request.status) === status);
    });
    const pending = rows.filter((r) => statusClass(r.status) === "pending");
    const pendingCount = ALL_LEAVE.filter((r) => statusClass(r.status) === "pending").length;

    const months = {};
    rows.forEach((r) => {
      const key = r.date ? new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase() : "OTHER";
      (months[key] ||= []).push(r);
    });

    const initials = (name) => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
    panel.innerHTML = `
      <div class="leave-template-top"><div class="leave-template-title">Pending Approval</div><span class="leave-template-badge">${pendingCount}</span></div>
      <div class="leave-template-card"><div class="leave-pending-list">${pending.length ? pending.map((r) => `
        <div class="leave-pending-row">
          <div class="leave-person">${escapeHtml(r.name || employeeName(r.employeeId))}</div>
          <div class="leave-meta">${escapeHtml(r.reason || "Leave request")} · ${escapeHtml(formatDate(r.date))}</div>
          <div class="leave-actions"><button class="leave-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button></div>
        </div>`).join("") : `<div class="leave-empty">No pending requests</div>`}</div></div>
      <div class="leave-template-filters" style="margin-top:18px"><input id="leaveTemplateSearch" type="text" placeholder="Search employee or reason…" value="${escapeHtml(search)}"><select id="leaveTemplateStatus"><option value="all">All statuses</option><option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option><option value="approved" ${status === "approved" ? "selected" : ""}>Approved</option><option value="denied" ${status === "denied" ? "selected" : ""}>Denied</option></select><button class="leave-template-reset" id="leaveTemplateReset" type="button">Reset</button></div>
      <div class="leave-all-head"><div class="leave-all-title">All Requests</div><span class="leave-all-count">${rows.length} request${rows.length === 1 ? "" : "s"}</span></div>
      <div>${rows.length ? Object.entries(months).map(([month, items]) => `<div class="leave-month">${month}</div>${items.map((r) => `<div class="leave-history-row"><div class="leave-avatar">${escapeHtml(initials(r.name || employeeName(r.employeeId)))}</div><div><div class="leave-history-name">${escapeHtml(r.name || employeeName(r.employeeId))}</div><div class="leave-history-date">${escapeHtml(formatDate(r.date))}</div></div><div class="leave-history-reason">${escapeHtml(r.reason || "Leave request")}</div><span class="leave-status ${statusClass(r.status)}">${escapeHtml(r.status)}</span>${statusClass(r.status) === "pending" ? `<div class="leave-status-btns"><button class="leave-small-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-small-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button></div>` : ""}</div>`).join("")}`).join("") : `<div class="leave-empty">No leave requests match your filters.</div>`}</div>
    `;

    panel.querySelector("#leaveTemplateSearch")?.addEventListener("input", render);
    panel.querySelector("#leaveTemplateStatus")?.addEventListener("change", render);
    panel.querySelector("#leaveTemplateReset")?.addEventListener("click", () => { render(); });
  }

  async function update(requestId, status) {
    try {
      await apiFetch(`/api/attendance/leave/${requestId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadData();
      render();
      showToast(`Leave request ${status.toLowerCase()}`);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function init() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    const panel = document.getElementById("panelLeave");
    if (!panel) return;
    try {
      await loadData();
      render();
      panel.addEventListener("click", (event) => {
        const button = event.target.closest("[data-template-leave-action]");
        if (!button) return;
        button.disabled = true;
        update(Number(button.dataset.requestId), button.dataset.templateLeaveAction || button.dataset.leaveAction || button.dataset.templateLeaveAction);
      });
    } catch (error) {
      panel.innerHTML = `<div class="leave-empty">Unable to load leave requests: ${escapeHtml(error.message)}</div>`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
