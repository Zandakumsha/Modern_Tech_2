(() => {
  "use strict";

  const COMPANY = {
    name: "Modern Tech",
    email: "info@moderntech.co.za",
    phone: "+27 (21) 555-0192",
    address: "101 Data Boulevard, Cape Town, 8001",
    hr: "Modern Tech Human Resources",
    approver: "HR Manager, Modern Tech"
  };

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = byId(id); if (el) el.textContent = value ?? "—"; };
  const setValue = (id, value) => { const el = byId(id); if (el) el.value = value ?? ""; };
  const money = (value) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const initials = (name) => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "E";

  function getUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; }
  }

  function clearAuth() {
    ["authToken", "currentUser", "user", "employeeId"].forEach(key => localStorage.removeItem(key));
    ["authenticated", "username", "role"].forEach(key => sessionStorage.removeItem(key));
  }

  function requireEmployee() {
    const user = getUser();
    const token = localStorage.getItem("authToken");
    const employeeId = Number(user.employeeId || localStorage.getItem("employeeId"));

    if (!token || user.role !== "Staff" || !Number.isInteger(employeeId) || employeeId <= 0) {
      clearAuth();
      window.location.replace("login.html");
      return null;
    }
    return { token, user, employeeId };
  }

  const session = requireEmployee();
  if (!session) return;

  let currentEmployee = {};

  function logout() {
    clearAuth();
    window.location.replace("login.html");
  }

  function openModal(id) { const modal = byId(id); if (modal) { modal.style.display = "flex"; modal.setAttribute("aria-hidden", "false"); } }
  function closeModal(id) { const modal = byId(id); if (modal) { modal.style.display = "none"; modal.setAttribute("aria-hidden", "true"); } }

  function populateLeaveForm() {
    setValue("leave-employee-name", currentEmployee.name);
    setValue("leave-employee-id", currentEmployee.employeeId);
    setValue("leave-department", currentEmployee.department);
    setValue("leave-approver", COMPANY.approver);
  }

  function calculateLeaveDays() {
    const from = byId("emp-leave-from")?.value;
    const to = byId("emp-leave-to")?.value;
    const days = byId("emp-leave-days");
    if (!days || !from || !to) return;
    const difference = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000) + 1;
    days.value = difference > 0 ? difference : 0;
  }

  function downloadLeaveForm(event) {
    event.preventDefault();
    const form = byId("emp-leave-form");
    if (!form || !form.reportValidity()) return;
    const data = new FormData(form);
    const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
    const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${COMPANY.name} Leave Request</title><style>body{font-family:Arial,sans-serif;margin:45px;color:#172033}.header{text-align:center;border-bottom:3px solid #00674f;padding-bottom:18px;margin-bottom:28px}.header h1{color:#00674f}.company{font-size:13px;line-height:1.6;color:#555}.row{display:flex;border-bottom:1px solid #ddd;padding:12px 0}.label{font-weight:bold;width:190px}.reason{min-height:120px;border:1px solid #ddd;padding:15px;margin-top:20px}.sign{display:flex;justify-content:space-between;margin-top:80px}.footer{margin-top:40px;text-align:center;font-size:12px;color:#777}</style></head><body><div class="header"><h1>${escapeHtml(COMPANY.name)}</h1><h2>EMPLOYEE LEAVE REQUEST FORM</h2><div class="company">${escapeHtml(COMPANY.address)}<br>${escapeHtml(COMPANY.phone)} • ${escapeHtml(COMPANY.email)}</div></div>${["employeeName","employeeId","department","leaveType","startDate","endDate","days","approver"].map(key => `<div class="row"><span class="label">${escapeHtml(key.replace(/([A-Z])/g," $1"))}</span><span>${escapeHtml(data.get(key))}</span></div>`).join("")}<div class="reason"><strong>Reason for Leave</strong><p>${escapeHtml(data.get("reason"))}</p></div><div class="sign"><div>Employee Signature: ____________________</div><div>Date: ____________________</div></div><div class="sign"><div>HR / Manager Signature: ____________________</div><div>Date: ____________________</div></div><div class="footer">${escapeHtml(COMPANY.hr)} • ${escapeHtml(COMPANY.email)} • ${escapeHtml(COMPANY.phone)}</div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Modern-Tech-Leave-Request-${currentEmployee.employeeId}.html`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    closeModal("emp-leave-modal");
  }

  function setupButtons() {
    byId("logout-btn")?.addEventListener("click", logout);
    byId("logout-btn")?.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); logout(); } });

    ["emp-header-message-btn", "emp-send-message-btn", "emp-send-message-link"].forEach(id => byId(id)?.addEventListener("click", event => { event.preventDefault(); openModal("emp-message-modal"); }));
    ["emp-header-leave-btn", "emp-request-leave-link"].forEach(id => byId(id)?.addEventListener("click", event => { event.preventDefault(); populateLeaveForm(); openModal("emp-leave-modal"); }));
    ["emp-cancel-message", "emp-close-message-modal"].forEach(id => byId(id)?.addEventListener("click", () => closeModal("emp-message-modal")));
    ["emp-cancel-leave", "emp-close-leave-modal"].forEach(id => byId(id)?.addEventListener("click", () => closeModal("emp-leave-modal")));
    byId("emp-leave-form")?.addEventListener("submit", downloadLeaveForm);
    byId("emp-leave-from")?.addEventListener("change", calculateLeaveDays);
    byId("emp-leave-to")?.addEventListener("change", calculateLeaveDays);
    byId("emp-message-form")?.addEventListener("submit", event => { event.preventDefault(); alert(`Your message has been submitted to ${COMPANY.hr}.`); event.target.reset(); closeModal("emp-message-modal"); });

    byId("theme-button")?.addEventListener("click", () => { document.body.classList.toggle("dark-theme"); localStorage.setItem("employeeTheme", document.body.classList.contains("dark-theme") ? "dark" : "light"); });
    if (localStorage.getItem("employeeTheme") === "dark") document.body.classList.add("dark-theme");
    document.querySelectorAll(".emp-modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; }));
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.token}`, Accept: "application/json" },
      cache: "no-store"
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) throw new Error(data.message || `Unable to load employee details (${response.status})`);

    currentEmployee = data.employee || {};
    const payroll = data.payroll || {};
    const attendance = data.attendance || {};
    const leave = data.leave || {};

    setText("sidebar-user-name", currentEmployee.name);
    setText("sidebar-user-email", currentEmployee.email);
    setText("sidebar_role", "Employee");
    setText("emp-username", currentEmployee.username);
    setText("emp-profile-name", currentEmployee.name);
    setText("emp-profile-email", currentEmployee.email);
    setText("account-username", currentEmployee.username);
    setText("account-email", currentEmployee.email);
    setText("account-id", currentEmployee.employeeId);
    setText("salary-value", money(currentEmployee.salary));
    setText("hours-value", payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—");
    setText("deductions-value", payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00");
    setText("net-pay-value", payroll.finalSalary != null ? money(payroll.finalSalary) : money(currentEmployee.salary));
    setText("present-days", attendance.presentDays);
    setText("absent-days", attendance.absentDays);
    setText("approved-leave", leave.approved);
    setText("pending-leave", leave.pending);
    setText("denied-leave", leave.denied);

    const avatar = byId("emp-profile-avatar");
    if (avatar) avatar.textContent = initials(currentEmployee.name);

    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div");
    [currentEmployee.employeeId, currentEmployee.employmentHistory, currentEmployee.phone, currentEmployee.department, currentEmployee.position, currentEmployee.employmentType, currentEmployee.manager, currentEmployee.employmentStatus].forEach((value, index) => { if (info[index]) info[index].textContent = value || "—"; });

    const summary = document.querySelectorAll(".emp-summary-card strong");
    if (summary[0]) summary[0].textContent = `${leave.approved} days`;
    if (summary[1]) summary[1].textContent = `${Math.max(0, 21 - Number(leave.approved || 0))} days`;
    if (summary[2]) summary[2].textContent = currentEmployee.department || "—";
    if (summary[3]) summary[3].textContent = currentEmployee.employmentStatus || "Active";

    const stats = document.querySelectorAll(".emp-profile-left .emp-stat b");
    if (stats[0]) stats[0].textContent = leave.approved || 0;
    if (stats[1]) stats[1].textContent = Math.max(0, 21 - Number(leave.approved || 0));

    const subtitle = document.querySelector(".emp-page-subtitle");
    if (subtitle) subtitle.textContent = `Welcome, ${currentEmployee.username}. Your employee information is loaded from the Modern Tech database.`;

    populateLeaveForm();
  }

  setupButtons();
  loadProfile().catch(error => {
    console.error("Employee profile load error:", error);
    const message = document.createElement("div");
    message.className = "emp-profile-load-error";
    message.textContent = `We could not load your employee information. ${error.message}`;
    document.querySelector(".emp-page")?.prepend(message);
  });
})();
