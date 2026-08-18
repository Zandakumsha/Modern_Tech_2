(() => {
  "use strict";
  const token = localStorage.getItem("authToken");
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } })();
  if (!token || storedUser.role !== "Staff" || !storedUser.employeeId) { window.location.href = "login.html"; return; }

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = byId(id); if (el) el.textContent = value ?? "—"; };
  const money = (value) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const initials = (name) => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
  let currentEmployee = {};

  function logout() { localStorage.removeItem("authToken"); localStorage.removeItem("currentUser"); localStorage.removeItem("user"); localStorage.removeItem("employeeId"); window.location.replace("login.html"); }
  function openModal(id) { const modal = byId(id); if (modal) modal.style.display = "flex"; }
  function closeModal(id) { const modal = byId(id); if (modal) modal.style.display = "none"; }

  function populateLeaveForm() {
    setTextInput("leave-employee-name", currentEmployee.name);
    setTextInput("leave-employee-id", currentEmployee.employeeId);
    setTextInput("leave-department", currentEmployee.department);
  }
  function setTextInput(id, value) { const el = byId(id); if (el) el.value = value ?? ""; }

  function downloadLeaveForm(event) {
    event.preventDefault();
    const form = byId("emp-leave-form");
    if (!form || !form.reportValidity()) return;
    const data = new FormData(form);
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
    const html = `<!doctype html><html><head><meta charset="UTF-8"><title>Modern Tech Leave Request</title><style>body{font-family:Arial,sans-serif;margin:45px;color:#172033}h1{text-align:center;color:#00674f}.header{text-align:center;border-bottom:3px solid #00674f;padding-bottom:18px;margin-bottom:28px}.row{display:flex;border-bottom:1px solid #ddd;padding:12px 0}.label{font-weight:bold;width:190px}.reason{min-height:120px;border:1px solid #ddd;padding:15px;margin-top:20px}.sign{display:flex;justify-content:space-between;margin-top:80px}.footer{margin-top:40px;text-align:center;font-size:12px;color:#777}</style></head><body><div class="header"><h1>MODERN TECH</h1><h2>EMPLOYEE LEAVE REQUEST FORM</h2><p>Generated from the Employee Portal</p></div><div class="row"><span class="label">Employee Name</span><span>${escapeHtml(data.get("employeeName"))}</span></div><div class="row"><span class="label">Employee ID</span><span>${escapeHtml(data.get("employeeId"))}</span></div><div class="row"><span class="label">Department</span><span>${escapeHtml(data.get("department"))}</span></div><div class="row"><span class="label">Leave Type</span><span>${escapeHtml(data.get("leaveType"))}</span></div><div class="row"><span class="label">Start Date</span><span>${escapeHtml(data.get("startDate"))}</span></div><div class="row"><span class="label">End Date</span><span>${escapeHtml(data.get("endDate"))}</span></div><div class="row"><span class="label">Number of Days</span><span>${escapeHtml(data.get("days"))}</span></div><div class="row"><span class="label">Manager / Approver</span><span>${escapeHtml(data.get("approver"))}</span></div><div class="reason"><strong>Reason for Leave</strong><p>${escapeHtml(data.get("reason"))}</p></div><div class="sign"><div>Employee Signature: ____________________</div><div>Date: ____________________</div></div><div class="sign"><div>Manager Signature: ____________________</div><div>Date: ____________________</div></div><div class="footer">Modern Tech Human Resources • Leave Request</div></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Modern-Tech-Leave-Request-${currentEmployee.employeeId || "employee"}.html`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    closeModal("emp-leave-modal");
  }

  function calculateLeaveDays() {
    const from = byId("emp-leave-from")?.value, to = byId("emp-leave-to")?.value, days = byId("emp-leave-days");
    if (!days || !from || !to) return;
    const difference = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000) + 1;
    days.value = difference > 0 ? difference : 0;
  }

  function setupButtons() {
    byId("logout-btn")?.addEventListener("click", logout);
    byId("logout-btn")?.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") logout(); });
    ["emp-header-message-btn", "emp-send-message-btn", "emp-send-message-link"].forEach(id => byId(id)?.addEventListener("click", e => { e.preventDefault(); openModal("emp-message-modal"); }));
    ["emp-header-leave-btn", "emp-request-leave-link"].forEach(id => byId(id)?.addEventListener("click", e => { e.preventDefault(); populateLeaveForm(); openModal("emp-leave-modal"); }));
    ["emp-cancel-message", "emp-close-message-modal"].forEach(id => byId(id)?.addEventListener("click", () => closeModal("emp-message-modal")));
    ["emp-cancel-leave", "emp-close-leave-modal"].forEach(id => byId(id)?.addEventListener("click", () => closeModal("emp-leave-modal")));
    byId("emp-leave-form")?.addEventListener("submit", downloadLeaveForm);
    byId("emp-message-form")?.addEventListener("submit", e => { e.preventDefault(); alert("Your message has been submitted to HR."); e.target.reset(); closeModal("emp-message-modal"); });
    byId("theme-button")?.addEventListener("click", () => { document.body.classList.toggle("dark-theme"); localStorage.setItem("employeeTheme", document.body.classList.contains("dark-theme") ? "dark" : "light"); });
    if (localStorage.getItem("employeeTheme") === "dark") document.body.classList.add("dark-theme");
    document.querySelectorAll(".emp-modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.style.display = "none"; }));
    byId("emp-leave-from")?.addEventListener("change", calculateLeaveDays); byId("emp-leave-to")?.addEventListener("change", calculateLeaveDays);
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", { headers: { Authorization: `Bearer ${token}` } });
    const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : {};
    if (!response.ok) throw new Error(data.message || "Unable to load employee details");
    const employee = data.employee || {}; currentEmployee = employee;
    const payroll = data.payroll || {}, attendance = data.attendance || {}, leave = data.leave || {};
    setText("sidebar-user-name", employee.name); setText("sidebar-user-email", employee.email); setText("sidebar_role", "Employee"); setText("emp-username", employee.username); setText("emp-profile-name", employee.name); setText("emp-profile-email", employee.email); setText("account-username", employee.username); setText("account-email", employee.email); setText("account-id", employee.employeeId); setText("salary-value", money(employee.salary)); setText("hours-value", payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—"); setText("deductions-value", payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00"); setText("net-pay-value", money(payroll.finalSalary ?? employee.salary)); setText("present-days", attendance.presentDays); setText("absent-days", attendance.absentDays); setText("approved-leave", leave.approved); setText("pending-leave", leave.pending); setText("denied-leave", leave.denied);
    const avatar = byId("emp-profile-avatar"); if (avatar) avatar.textContent = initials(employee.name);
    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div"); [employee.employeeId, employee.employmentHistory || "Not recorded", employee.phone, employee.department, employee.position, employee.employmentType, employee.manager, employee.employmentStatus].forEach((v,i) => { if (info[i]) info[i].textContent = v ?? "—"; });
    const summary = document.querySelectorAll(".emp-summary-card strong"); if(summary[0])summary[0].textContent=`${leave.approved} days`; if(summary[1])summary[1].textContent=`${Math.max(0,21-leave.approved)} days`; if(summary[2])summary[2].textContent=employee.department||"—"; if(summary[3])summary[3].textContent=employee.employmentStatus||"Active";
    const stats=document.querySelectorAll(".emp-profile-left .emp-stat b"); if(stats[0])stats[0].textContent=leave.approved; if(stats[1])stats[1].textContent=Math.max(0,21-leave.approved);
    const subtitle=document.querySelector(".emp-page-subtitle"); if(subtitle)subtitle.textContent=`Welcome, ${employee.username}. Your employee information is loaded from the Modern Tech database.`;
    populateLeaveForm();
  }
  setupButtons(); loadProfile().catch(error => { console.error(error); const message=document.createElement("div"); message.className="emp-profile-load-error"; message.textContent=error.message; document.querySelector(".emp-page")?.prepend(message); });
})();
