(() => {
  "use strict";

  const COMPANY = { name: "Modern Tech", email: "info@moderntech.co.za", phone: "+27 (21) 555-0192", address: "101 Data Boulevard, Cape Town, 8001", hr: "Modern Tech Human Resources", manager: "HR Manager, Modern Tech" };
  const getUser = () => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } };
  const clearAuth = () => { ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k)); ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k)); };
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value ?? "—"; };
  const money = value => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const initials = name => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "E";
  const user = getUser();
  const token = localStorage.getItem("authToken");
  const employeeId = Number(user.employeeId || localStorage.getItem("employeeId"));
  if (!token || user.role !== "Staff" || !Number.isInteger(employeeId) || employeeId <= 0) { clearAuth(); window.location.replace("login.html"); return; }
  let employee = {};
  function logout() { clearAuth(); window.location.replace("login.html"); }
  function openModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = "flex"; }
  function closeModal(id) { const modal = document.getElementById(id); if (modal) modal.style.display = "none"; }
  function goToLeaveRequest(event) { event?.preventDefault(); window.location.href = "leave-request.html"; }

  function setupButtons() {
    document.getElementById("logout-btn")?.addEventListener("click", logout);
    document.getElementById("logout-btn")?.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); logout(); } });
    ["emp-header-message-btn", "emp-send-message-btn", "emp-send-message-link"].forEach(id => document.getElementById(id)?.addEventListener("click", event => { event.preventDefault(); openModal("emp-message-modal"); }));
    ["emp-header-leave-btn", "emp-request-leave-link", "emp-bottom-leave-btn"].forEach(id => document.getElementById(id)?.addEventListener("click", goToLeaveRequest));
    ["emp-cancel-message", "emp-close-message-modal"].forEach(id => document.getElementById(id)?.addEventListener("click", () => closeModal("emp-message-modal")));
    document.getElementById("emp-message-form")?.addEventListener("submit", async event => {
      event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return;
      const payload = Object.fromEntries(new FormData(form).entries());
      try { const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ type: "message", title: payload.subject || `Message from ${employee.name}`, message: payload.message, payload }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "Unable to send message to HR"); form.reset(); closeModal("emp-message-modal"); alert("Your message has been sent to HR."); } catch (error) { alert(error.message); }
    });
    document.querySelectorAll(".emp-modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; }));
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) { clearAuth(); window.location.replace("login.html"); return; }
    if (!response.ok) throw new Error(data.message || `Unable to load employee details (${response.status})`);
    employee = data.employee || {}; const payroll = data.payroll || {}; const attendance = data.attendance || {}; const leave = data.leave || {};
    setText("sidebar-user-name", employee.name); setText("sidebar-user-email", employee.email); setText("sidebar_role", "Employee"); setText("emp-username", employee.username); setText("emp-profile-name", employee.name); setText("emp-profile-email", employee.email); setText("account-username", employee.username); setText("account-email", employee.email); setText("account-id", employee.employeeId);
    setText("salary-value", money(employee.salary)); setText("hours-value", payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—"); setText("deductions-value", payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00"); setText("net-pay-value", payroll.finalSalary != null ? money(payroll.finalSalary) : money(employee.salary));
    setText("present-days", attendance.presentDays); setText("absent-days", attendance.absentDays); setText("approved-leave", leave.approved); setText("pending-leave", leave.pending); setText("denied-leave", leave.denied);
    const avatar = document.getElementById("emp-profile-avatar"); if (avatar) avatar.textContent = initials(employee.name);
    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div"); [employee.employeeId, employee.employmentHistory, employee.phone, employee.department, employee.position, employee.employmentType, employee.manager, employee.employmentStatus].forEach((value, index) => { if (info[index]) info[index].textContent = value || "—"; });
    const summary = document.querySelectorAll(".emp-summary-card strong"); if (summary[0]) summary[0].textContent = `${leave.approved || 0} days`; if (summary[1]) summary[1].textContent = `${Math.max(0, 21 - Number(leave.approved || 0))} days`; if (summary[2]) summary[2].textContent = employee.department || "—"; if (summary[3]) summary[3].textContent = employee.employmentStatus || "Active";
    const stats = document.querySelectorAll(".emp-profile-left .emp-stat b"); if (stats[0]) stats[0].textContent = leave.approved || 0; if (stats[1]) stats[1].textContent = Math.max(0, 21 - Number(leave.approved || 0));
    const subtitle = document.querySelector(".emp-page-subtitle"); if (subtitle) subtitle.textContent = `Welcome, ${employee.username}. Your employee information is loaded from the Modern Tech database.`;
  }
  setupButtons(); loadProfile().catch(error => { console.error("Employee profile load error:", error); const page = document.querySelector(".emp-page"); if (page) { const message = document.createElement("div"); message.className = "emp-profile-load-error"; message.textContent = `We could not load your employee information. ${error.message}`; page.prepend(message); } });
})();
