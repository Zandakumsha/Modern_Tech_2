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
      #panelLeave.s_panel{padding:28px 26px 34px;background:#fff;border:1px solid #dfe4ea;border-radius:14px;box-shadow:0 3px 14px rgba(15,23,42,.07);font-size:16px}
      .leave-template-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.leave-template-title{font-size:22px;font-weight:800;color:#172033}.leave-template-badge{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#f97316;color:#fff;font-size:15px;font-weight:800}
      .leave-template-card{border:1px solid #d9dee5;border-radius:11px;background:#fff;overflow:hidden}.leave-pending-list{padding:0 16px 16px}.leave-pending-row{position:relative;padding:16px 16px 14px;border:1px solid #dfe4ea;border-left:4px solid #22c55e;border-radius:9px;margin-top:10px;background:#fff}.leave-pending-row:first-child{margin-top:0}.leave-person{font-size:16px;font-weight:800;color:#172033}.leave-meta{font-size:13px;color:#667085;margin-top:5px}.leave-actions{display:flex;gap:8px;margin-top:11px;align-items:center}.leave-action{border:0;border-radius:8px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer}.leave-action.approve{background:#22c55e;color:#fff}.leave-action.deny{background:#ef4444;color:#fff}.leave-action.view{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}.leave-action:disabled{opacity:.55;cursor:wait}
      .leave-all-head{display:flex;align-items:center;justify-content:space-between;margin:26px 0 12px}.leave-all-title{font-size:20px;font-weight:800;color:#172033}.leave-all-count{font-size:13px;color:#667085}.leave-month{font-size:12px;color:#667085;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #dfe4ea;padding:0 3px 6px;margin:16px 0 7px}.leave-history-row{display:grid;grid-template-columns:42px minmax(170px,1.3fr) minmax(120px,1fr) minmax(85px,.8fr) auto;align-items:center;gap:12px;min-height:62px;padding:11px 12px;border:1px solid #e1e5ea;border-radius:9px;margin:6px 0;background:#fff}.leave-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#8b5cf6;color:#fff;font-size:11px;font-weight:800}.leave-history-name{font-size:13px;font-weight:800;color:#172033}.leave-history-date{font-size:11px;color:#8a93a3;margin-top:3px}.leave-history-reason{font-size:12px;color:#667085}.leave-status{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:5px 9px;font-size:10px;font-weight:800;justify-self:start}.leave-status.pending{background:#fdf0bd;color:#9a6b00}.leave-status.approved{background:#d9f7df;color:#16833b}.leave-status.denied{background:#ffd9d9;color:#c52b2b}.leave-status-btns{display:flex;gap:6px;align-items:center}.leave-small-action{border:0;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:800;cursor:pointer}.leave-small-action.approve{background:#22c55e;color:#fff}.leave-small-action.deny{background:#ef4444;color:#fff}.leave-small-action.view{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}.leave-empty{padding:26px;text-align:center;color:#7b8493;font-size:14px}.leave-template-filters{display:grid;grid-template-columns:1fr 180px auto;gap:9px;margin:18px 0 12px}.leave-template-filters input,.leave-template-filters select{width:100%;border:1px solid #d9dee5;border-radius:7px;padding:10px 12px;font-size:13px;background:#fff}.leave-template-reset{border:1px solid #d9dee5;border-radius:7px;background:#fff;padding:9px 13px;font-size:12px;cursor:pointer}
      .leave-view-modal{position:fixed;inset:0;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}.leave-view-dialog{width:min(620px,100%);background:#fff;border-radius:14px;box-shadow:0 20px 50px rgba(15,23,42,.25);padding:26px}.leave-view-header{display:flex;justify-content:space-between;align-items:center;gap:15px;border-bottom:1px solid #e5e7eb;padding-bottom:15px}.leave-view-title{font-size:22px;font-weight:800;color:#172033}.leave-view-close{border:0;background:#f3f4f6;border-radius:8px;width:36px;height:36px;font-size:20px;cursor:pointer}.leave-view-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.leave-view-field{padding:13px;border:1px solid #e5e7eb;border-radius:9px;background:#f8fafc}.leave-view-label{display:block;font-size:11px;font-weight:800;text-transform:uppercase;color:#667085;margin-bottom:5px}.leave-view-value{font-size:14px;font-weight:600;color:#172033;white-space:pre-wrap;word-break:break-word}.leave-view-reason{grid-column:1 / -1}.leave-view-actions{display:flex;justify-content:flex-end;margin-top:20px}
      @media(max-width:800px){.leave-template-filters{grid-template-columns:1fr}.leave-history-row{grid-template-columns:36px 1fr}.leave-history-reason,.leave-status,.leave-status-btns{grid-column:2}.leave-view-grid{grid-template-columns:1fr}.leave-view-reason{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function requestDetails(request) {
    return `
      <div class="leave-view-modal" role="dialog" aria-modal="true" aria-labelledby="leaveViewTitle">
        <div class="leave-view-dialog">
          <div class="leave-view-header"><div class="leave-view-title" id="leaveViewTitle">Leave Request Details</div><button class="leave-view-close" type="button" aria-label="Close">&times;</button></div>
          <div class="leave-view-grid">
            <div class="leave-view-field"><span class="leave-view-label">Employee</span><span class="leave-view-value">${escapeHtml(request.name || employeeName(request.employeeId))}</span></div>
            <div class="leave-view-field"><span class="leave-view-label">Status</span><span class="leave-view-value">${escapeHtml(request.status || "Pending")}</span></div>
            <div class="leave-view-field"><span class="leave-view-label">Date</span><span class="leave-view-value">${escapeHtml(formatDate(request.date))}</span></div>
            <div class="leave-view-field"><span class="leave-view-label">Leave Type</span><span class="leave-view-value">${escapeHtml(request.type || request.leaveType || "Leave request")}</span></div>
            <div class="leave-view-field"><span class="leave-view-label">Start Date</span><span class="leave-view-value">${escapeHtml(formatDate(request.startDate || request.date))}</span></div>
            <div class="leave-view-field"><span class="leave-view-label">End Date</span><span class="leave-view-value">${escapeHtml(formatDate(request.endDate || request.date))}</span></div>
            <div class="leave-view-field leave-view-reason"><span class="leave-view-label">Reason</span><span class="leave-view-value">${escapeHtml(request.reason || "No reason provided")}</span></div>
          </div>
          <div class="leave-view-actions"><button class="leave-action view leave-view-close-action" type="button">Close</button></div>
        </div>
      </div>`;
  }

  function showRequest(requestId) {
    const request = ALL_LEAVE.find((r) => Number(r.requestId) === Number(requestId));
    if (!request) return showToast("Leave request could not be found");
    document.body.insertAdjacentHTML("beforeend", requestDetails(request));
    const modal = document.querySelector(".leave-view-modal:last-of-type");
    const close = () => modal?.remove();
    modal?.querySelector(".leave-view-close")?.addEventListener("click", close);
    modal?.querySelector(".leave-view-close-action")?.addEventListener("click", close);
    modal?.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", function escape(event) { if (event.key === "Escape") { close(); document.removeEventListener("keydown", escape); } });
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
          <div class="leave-actions"><button class="leave-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button><button class="leave-action view" data-view-leave-request="${r.requestId}">View Leave Request</button></div>
        </div>`).join("") : `<div class="leave-empty">No pending requests</div>`}</div></div>
      <div class="leave-template-filters"><input id="leaveTemplateSearch" type="text" placeholder="Search employee or reason…" value="${escapeHtml(search)}"><select id="leaveTemplateStatus"><option value="all">All statuses</option><option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option><option value="approved" ${status === "approved" ? "selected" : ""}>Approved</option><option value="denied" ${status === "denied" ? "selected" : ""}>Denied</option></select><button class="leave-template-reset" id="leaveTemplateReset" type="button">Reset</button></div>
      <div class="leave-all-head"><div class="leave-all-title">All Requests</div><span class="leave-all-count">${rows.length} request${rows.length === 1 ? "" : "s"}</span></div>
      <div>${rows.length ? Object.entries(months).map(([month, items]) => `<div class="leave-month">${month}</div>${items.map((r) => `<div class="leave-history-row"><div class="leave-avatar">${escapeHtml(initials(r.name || employeeName(r.employeeId)))}</div><div><div class="leave-history-name">${escapeHtml(r.name || employeeName(r.employeeId))}</div><div class="leave-history-date">${escapeHtml(formatDate(r.date))}</div></div><div class="leave-history-reason">${escapeHtml(r.reason || "Leave request")}</div><span class="leave-status ${statusClass(r.status)}">${escapeHtml(r.status)}</span>${statusClass(r.status) === "pending" ? `<div class="leave-status-btns"><button class="leave-small-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-small-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button><button class="leave-small-action view" data-view-leave-request="${r.requestId}">View Leave Request</button></div>` : `<div class="leave-status-btns"><button class="leave-small-action view" data-view-leave-request="${r.requestId}">View Leave Request</button></div>`}</div>`).join("")}`).join("") : `<div class="leave-empty">No leave requests match your filters.</div>`}</div>
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
        const viewButton = event.target.closest("[data-view-leave-request]");
        if (viewButton) { showRequest(Number(viewButton.dataset.viewLeaveRequest)); return; }
        const button = event.target.closest("[data-template-leave-action]");
        if (!button) return;
        button.disabled = true;
        update(Number(button.dataset.requestId), button.dataset.templateLeaveAction);
      });
    } catch (error) {
      panel.innerHTML = `<div class="leave-empty">Unable to load leave requests: ${escapeHtml(error.message)}</div>`;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
