(() => {
  "use strict";

  const token = localStorage.getItem("authToken");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("currentUser")) || {}; } catch {}

  if (!token || user.role !== "Staff" || !user.employeeId) {
    window.location.replace("login.html");
    return;
  }

  const form = document.getElementById("leave-form");
  const status = document.getElementById("status");
  const overlay = document.getElementById("result-overlay");
  let employee = { employeeId: user.employeeId, name: user.username || "Employee", department: "" };
  let submittedPayload = null;

  const setValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ""; };
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? ""; };
  const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));

  function showStatus(message, type = "error") {
    status.textContent = message;
    status.className = `status show ${type}`;
  }

  function clearAuthAndExit() {
    ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k));
    ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k));
    window.location.replace("login.html");
  }

  async function loadEmployee() {
    try {
      const response = await fetch("/api/employees/me", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) { clearAuthAndExit(); return; }
      if (!response.ok) throw new Error(data.message || "Unable to load employee details");
      employee = data.employee || employee;
    } catch (error) {
      console.error(error);
      showStatus(`Employee details could not be loaded: ${error.message}`);
    }

    const today = new Date().toISOString().slice(0, 10);
    setValue("employee-name", employee.name || user.username);
    setValue("request-date", today);
    setValue("department", employee.department || "");
    setText("employee-signature", employee.name || user.username || "Employee");
    setText("signature-date", new Date().toLocaleDateString("en-GB"));
  }

  function calculateDays() {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    const days = document.getElementById("days");
    const returnDate = document.getElementById("return-date");
    if (!start || !end) { days.value = ""; return; }
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    const diff = Math.floor((endDate - startDate) / 86400000) + 1;
    days.value = diff > 0 ? diff : "";
    if (diff > 0 && !returnDate.value) {
      const next = new Date(endDate);
      next.setDate(next.getDate() + 1);
      returnDate.value = next.toISOString().slice(0, 10);
    }
  }

  function getFormPayload() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.employeeId = employee.employeeId;
    data.employeeName = employee.name || user.username;
    data.department = employee.department || data.department || "";
    data.supervisor = document.getElementById("supervisor").value;
    data.requestDate = document.getElementById("request-date").value;
    data.days = document.getElementById("days").value;
    data.reasonCategories = [
      data.personal ? "Personal" : null,
      data.vacation ? "Vacation" : null,
      data.juryAssignment ? "Jury Assignment" : null,
    ].filter(Boolean);
    return data;
  }

  function buildPrintableHtml(payload) {
    const row = (label, value) => `<div class="cell label">${escapeHtml(label)}</div><div class="cell">${escapeHtml(value || "")}</div>`;
    const category = payload.reasonCategories.length ? payload.reasonCategories.join(", ") : "Not specified";
    const reason = [payload.personalReason, payload.vacationReason, payload.juryReason, payload.reasonNotes].filter(Boolean).join(" | ");
    return `<!doctype html><html><head><meta charset="utf-8"><title>Modern Tech Leave Request</title><style>*{box-sizing:border-box}body{font-family:Arial;margin:0;color:#111}.page{padding:18px;max-width:1100px;margin:auto}.title{font-size:22px;font-weight:700;border-bottom:1px solid #ccc;padding:10px 0}.section{border:1px solid #bbb;margin:16px 0}.head{background:#050505;color:#fff;font-weight:700;text-transform:uppercase;padding:7px 10px}.grid{display:grid;grid-template-columns:180px 1fr 180px 1fr}.cell{padding:9px 10px;border-right:1px solid #ccc;border-bottom:1px solid #ccc;min-height:40px}.label{font-weight:700;background:#fafafa}.full{grid-column:1/-1}.cert{text-align:center;font-style:italic;padding:14px;border-bottom:1px solid #ccc;line-height:1.5}.sig{display:grid;grid-template-columns:210px 1fr 70px 220px}.sig>div{padding:9px 10px;border-right:1px solid #ccc}.italic{font-style:italic}.footer{margin-top:20px;font-size:11px;color:#777;text-align:center}@media print{body{margin:0}.page{padding:0}.section{break-inside:avoid}} </style></head><body><div class="page"><div class="title">Request Leave</div><div class="section"><div class="head">Employee Details</div><div class="grid">${row("Name:",payload.employeeName)}${row("Date:",payload.requestDate)}${row("Department:",payload.department)}${row("Supervisor:",payload.supervisor)}</div></div><div class="section"><div class="head">Time Requesting Off</div><div class="grid">${row("Beginning On:",payload.startDate)}${row("Ending On:",payload.endDate)}${row("Days:",payload.days)}${row("Hours:",payload.hours)}${row("Return to Work:",payload.returnDate)}${row("Other:",payload.other)}${row("Notes:",payload.notes)}</div></div><div class="section"><div class="head">Reason for Request</div><div class="grid">${row("Category:",category)}${row("Reason:",reason)}</div></div><div class="section"><div class="head">Employee Certification</div><div class="cert">I certify that the above is accurate. I recognize that this request is subject to the approval of management and company policies.</div><div class="sig"><div class="label">Employee Signature:</div><div class="italic">${escapeHtml(payload.employeeName)}</div><div class="label">Date:</div><div>${escapeHtml(payload.requestDate)}</div></div></div><div class="section"><div class="head">Employer Decision</div><div class="grid"><div class="cell">Approved</div><div class="cell">☐</div><div class="cell">Not Approved</div><div class="cell">☐</div></div></div><div class="section"><div class="head">Supervisor / Management Signature</div><div class="sig"><div class="label">Signature:</div><div></div><div class="label">Date:</div><div>${escapeHtml(payload.managerDate)}</div><div class="label">Name Printed:</div><div>${escapeHtml(payload.managerName)}</div><div></div><div></div></div></div><div class="footer">Modern Tech • Employee Leave Request</div></div></body></html>`;
  }

  async function submitRequest(payload) {
    const reason = payload.reasonCategories.join(", ") || "Leave request";
    const message = `${payload.employeeName} requested ${payload.days || ""} day(s) of ${payload.leaveType || "leave"} from ${payload.startDate} to ${payload.endDate}. Reason: ${reason}${payload.personalReason || payload.vacationReason || payload.juryReason || payload.reasonNotes ? ` — ${[payload.personalReason,payload.vacationReason,payload.juryReason,payload.reasonNotes].filter(Boolean).join(" | ")}` : ""}`;
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "leave", title: `Leave request from ${payload.employeeName}`, message, payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to send leave request to HR");
    return data;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const payload = getFormPayload();
    if (!payload.days || Number(payload.days) <= 0) { showStatus("Please choose a valid beginning and ending date."); return; }
    const button = document.getElementById("submit-btn");
    button.disabled = true;
    button.textContent = "Submitting...";
    try {
      await submitRequest(payload);
      submittedPayload = payload;
      showStatus("Leave request sent to HR successfully.", "success");
      overlay.classList.add("show");
    } catch (error) {
      console.error(error);
      showStatus(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Submit Request";
    }
  });

  document.getElementById("start-date").addEventListener("change", calculateDays);
  document.getElementById("end-date").addEventListener("change", calculateDays);

  document.getElementById("download-pdf").addEventListener("click", () => {
    if (!submittedPayload) return;
    const printWindow = window.open("", "_blank", "width=1100,height=900");
    if (!printWindow) { showStatus("Please allow pop-ups to print/download the form."); return; }
    printWindow.document.write(buildPrintableHtml(submittedPayload));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  });

  document.getElementById("result-exit").addEventListener("click", () => window.location.replace("employee.html"));
  ["exit-btn", "exit-top"].forEach(id => document.getElementById(id).addEventListener("click", () => window.location.replace("employee.html")));

  loadEmployee();
})();
