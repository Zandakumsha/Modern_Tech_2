(() => {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const employeeName = (id) => EMPLOYEES.find((e) => Number(e.employeeId) === Number(id))?.name || "Unknown employee";
  const employeeRecord = (id) => EMPLOYEES.find((e) => Number(e.employeeId) === Number(id)) || {};
  const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "UTC" }) : "";
  const formatInputDate = (value) => value ? String(value).slice(0, 10) : "";
  const formatDecisionDate = (value) => value ? new Date(value).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "";
  const statusClass = (status) => String(status || "pending").toLowerCase();

  const reasonOptions = [
    ["vacation", "Vacation"], ["juryAssignment", "Civil Leave/Jury Duty"], ["military", "Military"],
    ["sickSelf", "Sick - Self"], ["sickFamily", "Sick - Family"], ["appointment", "Sick - Dr Appointment"],
    ["workersComp", "Workers Comp"], ["familyMedical", "Family and Medical"], ["leaveAbsence", "Leave of Absence"],
    ["funeral", "Funeral Relationship"], ["otherReasonType", "Other"]
  ];

  function injectStyles() {
    if (document.getElementById("attendance-leave-template-styles")) return;
    const style = document.createElement("style");
    style.id = "attendance-leave-template-styles";
    style.textContent = `
      #panelLeave.s_panel{padding:28px 26px 34px;background:#fff;border:1px solid #dfe4ea;border-radius:14px;box-shadow:0 3px 14px rgba(15,23,42,.07);font-size:16px}
      .leave-template-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.leave-template-title{font-size:22px;font-weight:800;color:#172033}.leave-template-badge{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#f97316;color:#fff;font-size:15px;font-weight:800}
      .leave-template-card{border:1px solid #d9dee5;border-radius:11px;background:#fff;overflow:hidden}.leave-pending-list{padding:0 16px 16px}.leave-pending-row{padding:16px;border:1px solid #dfe4ea;border-left:4px solid #22c55e;border-radius:9px;margin-top:10px;background:#fff}.leave-pending-row:first-child{margin-top:0}.leave-person{font-size:16px;font-weight:800;color:#172033}.leave-meta{font-size:13px;color:#667085;margin-top:5px}.leave-actions{display:flex;gap:8px;margin-top:11px;align-items:center;flex-wrap:wrap}.leave-action{border:0;border-radius:8px;padding:8px 13px;font-size:12px;font-weight:800;cursor:pointer}.leave-action.approve{background:#22c55e;color:#fff}.leave-action.deny{background:#ef4444;color:#fff}.leave-action.view{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}.leave-action:disabled{opacity:.55;cursor:wait}
      .leave-all-head{display:flex;align-items:center;justify-content:space-between;margin:26px 0 12px}.leave-all-title{font-size:20px;font-weight:800;color:#172033}.leave-all-count{font-size:13px;color:#667085}.leave-month{font-size:12px;color:#667085;font-weight:800;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #dfe4ea;padding:0 3px 6px;margin:16px 0 7px}.leave-history-row{display:grid;grid-template-columns:42px minmax(170px,1.3fr) minmax(120px,1fr) minmax(85px,.8fr) auto;align-items:center;gap:12px;min-height:62px;padding:11px 12px;border:1px solid #e1e5ea;border-radius:9px;margin:6px 0;background:#fff}.leave-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#8b5cf6;color:#fff;font-size:11px;font-weight:800}.leave-history-name{font-size:13px;font-weight:800;color:#172033}.leave-history-date{font-size:11px;color:#8a93a3;margin-top:3px}.leave-history-reason{font-size:12px;color:#667085}.leave-status{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:5px 9px;font-size:10px;font-weight:800;justify-self:start}.leave-status.pending{background:#fdf0bd;color:#9a6b00}.leave-status.approved{background:#d9f7df;color:#16833b}.leave-status.denied{background:#ffd9d9;color:#c52b2b}.leave-status-btns{display:flex;gap:6px;align-items:center}.leave-small-action{border:0;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:800;cursor:pointer}.leave-small-action.approve{background:#22c55e;color:#fff}.leave-small-action.deny{background:#ef4444;color:#fff}.leave-small-action.view{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe}.leave-empty{padding:26px;text-align:center;color:#7b8493;font-size:14px}.leave-template-filters{display:grid;grid-template-columns:1fr 180px auto;gap:9px;margin:18px 0 12px}.leave-template-filters input,.leave-template-filters select{width:100%;border:1px solid #d9dee5;border-radius:7px;padding:10px 12px;font-size:13px;background:#fff}.leave-template-reset{border:1px solid #d9dee5;border-radius:7px;background:#fff;padding:9px 13px;font-size:12px;cursor:pointer}
      .leave-view-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:12px;z-index:9999;overflow:auto}.leave-view-dialog{width:min(980px,100%);max-height:96vh;overflow:auto;background:#ececec;color:#222;font-family:Arial,Helvetica,sans-serif;padding:14px;box-shadow:0 20px 50px rgba(15,23,42,.3)}.leave-form-card{background:#fff;border:1px solid #aaa;padding:18px}.leave-form-head{display:flex;align-items:center;justify-content:center;position:relative;border:2px solid #222;padding:7px 45px;margin-bottom:18px}.leave-form-head h2{font-size:24px;margin:0;font-weight:500;letter-spacing:.3px}.leave-form-close{position:absolute;right:7px;top:1px;border:0;background:transparent;font-size:29px;cursor:pointer}.leave-form-body{padding:0 6px}.leave-emp-grid{display:grid;grid-template-columns:80px 1fr 42px 1fr;gap:8px;align-items:end;margin:8px 0 16px}.leave-emp-grid label,.leave-field-label{font-size:12px}.leave-line{width:100%;border:0;border-bottom:1px solid #555;outline:0;background:transparent;padding:3px;font:inherit}.leave-section-title{border:1px solid #444;text-align:center;font-weight:700;font-size:13px;padding:5px;text-transform:uppercase;margin:15px 0}.leave-reason-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 18px;padding:0 4px}.leave-reason-option{display:grid;grid-template-columns:24px auto 1fr;align-items:center;gap:5px;min-height:30px;font-size:12px}.leave-reason-option input[type=checkbox]{width:18px;height:18px;margin:0}.leave-reason-line{border:0;border-bottom:1px solid #777;outline:0;width:100%;background:transparent;padding:2px;font-size:12px}.leave-request-grid{display:grid;grid-template-columns:70px 1fr 65px 1fr 1fr 170px;gap:7px 9px;align-items:end;font-size:12px;padding:0 8px}.leave-request-grid .wide{grid-column:2/-1}.leave-request-grid label{white-space:nowrap}.leave-form-readonly{pointer-events:none}.leave-signature-row{display:grid;grid-template-columns:100px 1fr 45px 180px;gap:8px;align-items:end;font-size:12px;border-top:1px solid #777;padding-top:13px;margin-top:18px}.leave-supervisor-box{border:2px solid #222;text-align:center;font-size:13px;font-weight:700;padding:6px;margin:15px 0 18px}.leave-comments{width:100%;height:52px;border:0;border-bottom:1px solid #777;border-top:1px solid #777;outline:0;resize:none;background:transparent;padding:7px;font:inherit}.leave-supervisor-fields{display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:8px;font-size:12px}.leave-supervisor-fields input{border:0;border-bottom:1px solid #777;outline:0;background:transparent;padding:4px}.leave-decision-info{margin-top:12px;border-top:1px solid #777;padding-top:10px;display:grid;grid-template-columns:120px 1fr 120px 1fr;gap:8px;font-size:12px}.leave-decision-info strong{font-weight:700}.leave-form-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px}.leave-form-btn{border:1px solid #777;background:#fff;padding:9px 17px;font-weight:700;cursor:pointer}.leave-status-line{margin:10px 0 0;text-align:right;font-size:12px;font-weight:700}.leave-status-line.pending{color:#9a6b00}.leave-status-line.approved{color:#16833b}.leave-status-line.denied{color:#c52b2b}
      @media(max-width:800px){.leave-template-filters{grid-template-columns:1fr}.leave-history-row{grid-template-columns:36px 1fr}.leave-history-reason,.leave-status,.leave-status-btns{grid-column:2}.leave-reason-grid{grid-template-columns:1fr}.leave-request-grid{grid-template-columns:65px 1fr}.leave-request-grid .wide{grid-column:2}.leave-signature-row{grid-template-columns:100px 1fr}.leave-decision-info{grid-template-columns:1fr}.leave-form-head h2{font-size:19px}.leave-view-dialog{padding:8px}.leave-form-card{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function normaliseReason(request) { return `${request.type || request.leaveType || ""} ${request.reason || ""}`.toLowerCase(); }
  function reasonChecked(request, label) {
    const text = normaliseReason(request);
    const aliases = { "Vacation": ["vacation"], "Civil Leave/Jury Duty": ["jury", "civil leave"], Military: ["military"], "Sick - Self": ["sick - self", "sick self"], "Sick - Family": ["sick - family", "sick family"], "Sick - Dr Appointment": ["doctor", "dr appointment", "appointment"], "Workers Comp": ["workers comp", "workers compensation"], "Family and Medical": ["family and medical"], "Leave of Absence": ["leave of absence"], "Funeral Relationship": ["funeral"], Other: ["other"] };
    return (aliases[label] || [label.toLowerCase()]).some((value) => text.includes(value));
  }

  function requestDetails(request) {
    const employee = employeeRecord(request.employeeId);
    const name = request.name || employee.name || employeeName(request.employeeId);
    const department = request.department || employee.department || "";
    const supervisor = request.supervisor || employee.manager || "HR Manager, Modern Tech";
    const requestDate = formatInputDate(request.requestDate || request.createdAt || request.date);
    const startDate = formatInputDate(request.startDate || request.date);
    const endDate = formatInputDate(request.endDate || request.date);
    const days = request.days || (startDate && endDate ? Math.max(1, Math.round((new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000) + 1) : "");
    const status = statusClass(request.status);
    const reason = request.reason || request.type || request.leaveType || "";
    const decided = status === "approved" || status === "denied";
    const decisionLabel = status === "approved" ? "Approved By" : status === "denied" ? "Denied By" : "HR Decision";
    const decisionName = decided ? (request.decidedByName || "HR Manager") : "Pending";
    const selectedReasons = reasonOptions.map(([key, label]) => `<label class="leave-reason-option"><input type="checkbox" ${reasonChecked(request, label) ? "checked" : ""} disabled><span>${escapeHtml(label)}</span><input class="leave-reason-line" value="${escapeHtml(reasonChecked(request, label) && label !== reason ? reason : "")}" readonly></label>`).join("");

    return `<div class="leave-view-modal" role="dialog" aria-modal="true" aria-labelledby="attendanceLeaveViewTitle"><div class="leave-view-dialog"><div class="leave-form-card">
      <header class="leave-form-head"><h2 id="attendanceLeaveViewTitle">Employee Leave Request Form</h2><button class="leave-form-close" type="button" aria-label="Close">&times;</button></header>
      <div class="leave-form-body leave-form-readonly">
        <div class="leave-emp-grid"><label>Employee Name</label><input class="leave-line" value="${escapeHtml(name)}" readonly><label>Date</label><input class="leave-line" value="${escapeHtml(formatDate(requestDate || request.date))}" readonly><label>Department</label><input class="leave-line" value="${escapeHtml(department)}" readonly><label>Supervisor Name</label><input class="leave-line" value="${escapeHtml(supervisor)}" readonly></div>
        <div class="leave-section-title">REASON FOR LEAVE</div><div class="leave-reason-grid">${selectedReasons}</div>
        <div class="leave-section-title">LEAVE REQUESTED</div><div class="leave-request-grid"><label>From</label><input class="leave-line" type="date" value="${escapeHtml(startDate)}" readonly><label>Time</label><input class="leave-line" type="time" value="${escapeHtml(request.startTime || "")}" readonly><label>Total Hours Requested</label><input class="leave-line" type="number" value="${escapeHtml(request.hours || "")}" readonly><label>To</label><input class="leave-line" type="date" value="${escapeHtml(endDate)}" readonly><label>Time</label><input class="leave-line" type="time" value="${escapeHtml(request.endTime || "")}" readonly><label>Total Days Requested</label><input class="leave-line" value="${escapeHtml(days)}" readonly><label>Other</label><input class="leave-line wide" value="${escapeHtml(request.reasonNotes || "")}" readonly><label class="wide">Additional Notes</label><input class="leave-line wide" value="${escapeHtml(request.notes || "")}" readonly></div>
        <div class="leave-signature-row"><label>Employee Signature</label><div class="leave-line">${escapeHtml(name)}</div><label>Date</label><div class="leave-line">${escapeHtml(formatDate(requestDate || request.date))}</div></div>
        <div class="leave-supervisor-box">SUPERVISOR USE ONLY</div><label class="leave-field-label">Comments</label><textarea class="leave-comments" readonly>${escapeHtml(request.comments || "")}</textarea>
        <div class="leave-supervisor-fields"><label>HR Manager</label><input value="${escapeHtml(decided ? decisionName : "Pending")}" readonly><label>Decision</label><input value="${escapeHtml(request.status || "Pending")}" readonly></div>
        <div class="leave-decision-info"><strong>${escapeHtml(decisionLabel)}</strong><span>${escapeHtml(decisionName)}</span><strong>Decision Date</strong><span>${escapeHtml(decided ? formatDecisionDate(request.decidedAt) : "Pending")}</span>${request.decidedByEmail ? `<strong>HR Email</strong><span>${escapeHtml(request.decidedByEmail)}</span>` : ""}</div>
        <div class="leave-status-line ${escapeHtml(status)}">Status: ${escapeHtml(request.status || "Pending")}</div>
      </div><div class="leave-form-actions"><button class="leave-form-btn" type="button">Exit</button></div>
    </div></div></div>`;
  }

  function showRequest(requestId) {
    const request = ALL_LEAVE.find((r) => Number(r.requestId) === Number(requestId));
    if (!request) return showToast("Leave request could not be found");
    document.body.insertAdjacentHTML("beforeend", requestDetails(request));
    const modal = document.querySelector(".leave-view-modal:last-of-type");
    const close = () => modal?.remove();
    modal?.querySelector(".leave-form-close")?.addEventListener("click", close);
    modal?.querySelector(".leave-form-btn")?.addEventListener("click", close);
    modal?.addEventListener("click", (event) => { if (event.target === modal) close(); });
    const escapeHandler = (event) => { if (event.key === "Escape") { close(); document.removeEventListener("keydown", escapeHandler); } };
    document.addEventListener("keydown", escapeHandler);
  }

  function render() {
    const panel = document.getElementById("panelLeave"); if (!panel) return; injectStyles();
    const search = (document.getElementById("leaveTemplateSearch")?.value || "").toLowerCase().trim();
    const status = document.getElementById("leaveTemplateStatus")?.value || "all";
    const rows = ALL_LEAVE.filter((request) => { const text = `${request.name || employeeName(request.employeeId)} ${request.reason || ""}`.toLowerCase(); return (!search || text.includes(search)) && (status === "all" || statusClass(request.status) === status); });
    const pending = rows.filter((r) => statusClass(r.status) === "pending");
    const pendingCount = ALL_LEAVE.filter((r) => statusClass(r.status) === "pending").length;
    const months = {}; rows.forEach((r) => { const key = r.date ? new Date(`${r.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase() : "OTHER"; (months[key] ||= []).push(r); });
    const initials = (name) => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
    panel.innerHTML = `<div class="leave-template-top"><div class="leave-template-title">Pending Approval</div><span class="leave-template-badge">${pendingCount}</span></div><div class="leave-template-card"><div class="leave-pending-list">${pending.length ? pending.map((r) => `<div class="leave-pending-row"><div class="leave-person">${escapeHtml(r.name || employeeName(r.employeeId))}</div><div class="leave-meta">${escapeHtml(r.reason || "Leave request")} · ${escapeHtml(formatDate(r.date))}</div><div class="leave-actions"><button class="leave-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button><button class="leave-action view" data-view-leave-request="${r.requestId}">View Leave Request</button></div></div>`).join("") : `<div class="leave-empty">No pending requests</div>`}</div></div><div class="leave-template-filters"><input id="leaveTemplateSearch" type="text" placeholder="Search employee or reason…" value="${escapeHtml(search)}"><select id="leaveTemplateStatus"><option value="all">All statuses</option><option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option><option value="approved" ${status === "approved" ? "selected" : ""}>Approved</option><option value="denied" ${status === "denied" ? "selected" : ""}>Denied</option></select><button class="leave-template-reset" id="leaveTemplateReset" type="button">Reset</button></div><div class="leave-all-head"><div class="leave-all-title">All Requests</div><span class="leave-all-count">${rows.length} request${rows.length === 1 ? "" : "s"}</span></div><div>${rows.length ? Object.entries(months).map(([month, items]) => `<div class="leave-month">${month}</div>${items.map((r) => `<div class="leave-history-row"><div class="leave-avatar">${escapeHtml(initials(r.name || employeeName(r.employeeId)))}</div><div><div class="leave-history-name">${escapeHtml(r.name || employeeName(r.employeeId))}</div><div class="leave-history-date">${escapeHtml(formatDate(r.date))}</div></div><div class="leave-history-reason">${escapeHtml(r.reason || "Leave request")}</div><span class="leave-status ${statusClass(r.status)}">${escapeHtml(r.status || "Pending")}</span><div class="leave-status-btns">${statusClass(r.status) === "pending" ? `<button class="leave-small-action approve" data-template-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="leave-small-action deny" data-template-leave-action="Denied" data-request-id="${r.requestId}">Deny</button>` : ""}<button class="leave-small-action view" data-view-leave-request="${r.requestId}">View Leave Request</button></div></div>`).join("")}`).join("") : `<div class="leave-empty">No leave requests match your filters.</div>`}</div>`;
    panel.querySelector("#leaveTemplateSearch")?.addEventListener("input", render); panel.querySelector("#leaveTemplateStatus")?.addEventListener("change", render); panel.querySelector("#leaveTemplateReset")?.addEventListener("click", () => { document.getElementById("leaveTemplateSearch").value = ""; document.getElementById("leaveTemplateStatus").value = "all"; render(); });
  }

  async function update(requestId, status) {
    try { await apiFetch(`/api/attendance/leave/${requestId}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadData(); render(); showToast(`Leave request ${status.toLowerCase()}`); } catch (error) { showToast(error.message); }
  }

  async function init() {
    await new Promise((resolve) => setTimeout(resolve, 0)); const panel = document.getElementById("panelLeave"); if (!panel) return;
    try { await loadData(); render(); panel.addEventListener("click", (event) => { const viewButton = event.target.closest("[data-view-leave-request]"); if (viewButton) { showRequest(Number(viewButton.dataset.viewLeaveRequest)); return; } const button = event.target.closest("[data-template-leave-action]"); if (!button) return; button.disabled = true; update(Number(button.dataset.requestId), button.dataset.templateLeaveAction); }); } catch (error) { panel.innerHTML = `<div class="leave-empty">Unable to load leave requests: ${escapeHtml(error.message)}</div>`; }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
