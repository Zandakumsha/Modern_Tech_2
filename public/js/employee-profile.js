(() => {
  "use strict";

  const COMPANY = {
    name: "Modern Tech",
    email: "info@moderntech.co.za",
    phone: "+27 (21) 555-0192",
    address: "101 Data Boulevard, Cape Town, 8001",
    hr: "Modern Tech Human Resources",
    manager: "HR Manager, Modern Tech",
  };

  const getUser = () => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } };
  const clearAuth = () => {
    ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k));
    ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k));
  };
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? "—"; };
  const setValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ""; };
  const money = value => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const initials = name => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "E";

  const user = getUser();
  const token = localStorage.getItem("authToken");
  const employeeId = Number(user.employeeId || localStorage.getItem("employeeId"));

  if (!token || user.role !== "Staff" || !Number.isInteger(employeeId) || employeeId <= 0) {
    clearAuth();
    window.location.replace("login.html");
    return;
  }

  let employee = {};

  function logout() {
    clearAuth();
    window.location.replace("login.html");
  }

  function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = "flex"; }
  function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = "none"; }

  function populateLeaveForm() {
    setValue("leave-employee-name", employee.name);
    setValue("leave-employee-id", employee.employeeId);
    setValue("leave-department", employee.department);
    setValue("leave-approver", COMPANY.manager);
  }

  function calculateLeaveDays() {
    const start = document.getElementById("emp-leave-from")?.value;
    const end = document.getElementById("emp-leave-to")?.value;
    const days = document.getElementById("emp-leave-days");
    if (!start || !end || !days) return;
    const value = Math.floor((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
    days.value = value > 0 ? value : 0;
  }

  async function createNotification(type, title, message, payload) {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, title, message, employeeId: employee.employeeId, employeeName: employee.name, payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to send notification to HR");
    return data;
  }

  function downloadLeaveForm(event) {
    event.preventDefault();
    const form = document.getElementById("emp-leave-form");
    if (!form || !form.reportValidity()) return;
    const data = new FormData(form);
    const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
    const rows = ["employeeName", "employeeId", "department", "leaveType", "startDate", "endDate", "days", "approver"]
      .map(key => `<div class="row"><strong>${escapeHtml(key.replace(/([A-Z])/g, " $1"))}</strong><span>${escapeHtml(data.get(key))}</span></div>`).join("");
    const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(COMPANY.name)} Leave Request</title><style>body{font-family:Arial;margin:45px;color:#172033}.header{text-align:center;border-bottom:3px solid #00674f;padding-bottom:18px}.header h1{color:#00674f}.row{display:flex;gap:30px;border-bottom:1px solid #ddd;padding:12px}.row strong{width:190px}.reason{border:1px solid #ddd;padding:15px;margin-top:20px;min-height:100px}.sign{display:flex;justify-content:space-between;margin-top:70px}.footer{text-align:center;margin-top:40px;color:#777}</style></head><body><div class="header"><h1>${escapeHtml(COMPANY.name)}</h1><h2>EMPLOYEE LEAVE REQUEST FORM</h2><div>${escapeHtml(COMPANY.address)}<br>${escapeHtml(COMPANY.phone)} • ${escapeHtml(COMPANY.email)}</div></div>${rows}<div class="reason"><strong>Reason for Leave</strong><p>${escapeHtml(data.get("reason"))}</p></div><div class="sign"><span>Employee Signature: ____________________</span><span>Date: ____________________</span></div><div class="sign"><span>HR / Manager Signature: ____________________</span><span>Date: ____________________</span></div><div class="footer">${escapeHtml(COMPANY.hr)} • ${escapeHtml(COMPANY.email)}</div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Modern-Tech-Leave-Request-${employee.employeeId}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    closeModal("emp-leave-modal");
  }

  function setupButtons() {
    document.getElementById("logout-btn")?.addEventListener("click", logout);
    document.getElementById("logout-btn")?.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); logout(); }
    });

    ["emp-header-message-btn", "emp-send-message-btn", "emp-send-message-link"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", event => { event.preventDefault(); openModal("emp-message-modal"); });
    });
    ["emp-header-leave-btn", "emp-request-leave-link"].forEach(id => {
      document.getElementById(id)?.addEventListener("click", event => { event.preventDefault(); populateLeaveForm(); openModal("emp-leave-modal"); });
    });
    ["emp-cancel-message", "emp-close-message-modal"].forEach(id => document.getElementById(id)?.addEventListener("click", () => closeModal("emp-message-modal")));
    ["emp-cancel-leave", "emp-close-leave-modal"].forEach(id => document.getElementById(id)?.addEventListener("click", () => closeModal("emp-leave-modal")));

    document.getElementById("emp-leave-from")?.addEventListener("change", calculateLeaveDays);
    document.getElementById("emp-leave-to")?.addEventListener("change", calculateLeaveDays);

    document.getElementById("emp-leave-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const payload = Object.fromEntries(new FormData(form).entries());
      try {
        await createNotification("leave", `Leave request from ${employee.name}`, `Leave request submitted by ${employee.name}.`, payload);
        downloadLeaveForm(event);
        alert("Your leave request was sent to HR and the leave form was downloaded.");
      } catch (error) { alert(error.message); }
    });

    document.getElementById("emp-message-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const payload = Object.fromEntries(new FormData(form).entries());
      try {
        await createNotification("message", payload.subject || `Message from ${employee.name}`, payload.message, payload);
        form.reset();
        closeModal("emp-message-modal");
        alert("Your message has been sent to HR.");
      } catch (error) { alert(error.message); }
    });

    document.querySelectorAll(".emp-modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; }));
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { clearAuth(); window.location.replace("login.html"); return; }
    if (!response.ok) throw new Error(data.message || `Unable to load employee details (${response.status})`);

    employee = data.employee || {};
    const payroll = data.payroll || {};
    const attendance = data.attendance || {};
    const leave = data.leave || {};

    setText("sidebar-user-name", employee.name);
    setText("sidebar-user-email", employee.email);
    setText("sidebar_role", "Employee");
    setText("emp-username", employee.username);
    setText("emp-profile-name", employee.name);
    setText("emp-profile-email", employee.email);
    setText("account-username", employee.username);
    setText("account-email", employee.email);
    setText("account-id", employee.employeeId);
    setText("salary-value", money(employee.salary));
    setText("hours-value", payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—");
    setText("deductions-value", payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00");
    setText("net-pay-value", payroll.finalSalary != null ? money(payroll.finalSalary) : money(employee.salary));
    setText("present-days", attendance.presentDays);
    setText("absent-days", attendance.absentDays);
    setText("approved-leave", leave.approved);
    setText("pending-leave", leave.pending);
    setText("denied-leave", leave.denied);

    const avatar = document.getElementById("emp-profile-avatar");
    if (avatar) avatar.textContent = initials(employee.name);

    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div");
    [employee.employeeId, employee.employmentHistory, employee.phone, employee.department, employee.position, employee.employmentType, employee.manager, employee.employmentStatus]
      .forEach((value, index) => { if (info[index]) info[index].textContent = value || "—"; });

    const summary = document.querySelectorAll(".emp-summary-card strong");
    if (summary[0]) summary[0].textContent = `${leave.approved || 0} days`;
    if (summary[1]) summary[1].textContent = `${Math.max(0, 21 - Number(leave.approved || 0))} days`;
    if (summary[2]) summary[2].textContent = employee.department || "—";
    if (summary[3]) summary[3].textContent = employee.employmentStatus || "Active";

    const stats = document.querySelectorAll(".emp-profile-left .emp-stat b");
    if (stats[0]) stats[0].textContent = leave.approved || 0;
    if (stats[1]) stats[1].textContent = Math.max(0, 21 - Number(leave.approved || 0));

    const subtitle = document.querySelector(".emp-page-subtitle");
    if (subtitle) subtitle.textContent = `Welcome, ${employee.username}. Your employee information is loaded from the Modern Tech database.`;
    populateLeaveForm();
  }

  setupButtons();
  loadProfile().catch(error => {
    console.error("Employee profile load error:", error);
    const page = document.querySelector(".emp-page");
    if (page) {
      const message = document.createElement("div");
      message.className = "emp-profile-load-error";
      message.textContent = `We could not load your employee information. ${error.message}`;
      page.prepend(message);
    }
  });
})();
