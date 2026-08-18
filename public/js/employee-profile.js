(() => {
  "use strict";

  const token = localStorage.getItem("authToken");
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; }
  })();

  if (!token || storedUser.role !== "Staff" || !storedUser.employeeId) {
    window.location.href = "login.html";
    return;
  }

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => { const el = byId(id); if (el) el.textContent = value ?? "—"; };
  const money = (value) => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function initials(name) {
    return String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : {};
    if (!response.ok) throw new Error(data.message || "Unable to load employee details");

    const employee = data.employee || {};
    const payroll = data.payroll || {};
    const attendance = data.attendance || {};
    const leave = data.leave || {};

    setText("sidebar-user-name", employee.name);
    setText("sidebar-user-email", employee.email);
    setText("sidebar_role", "Employee");
    setText("emp-username", employee.username);
    setText("emp-profile-name", employee.name);
    setText("emp-profile-email", employee.email);

    const avatar = byId("emp-profile-avatar");
    if (avatar) avatar.textContent = initials(employee.name);

    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div");
    const values = [
      employee.employeeId,
      employee.employmentHistory || "Not recorded",
      employee.phone,
      employee.department,
      employee.position,
      employee.employmentType,
      employee.manager,
      employee.employmentStatus,
    ];
    info.forEach((el, index) => { if (values[index] !== undefined) el.textContent = values[index]; });

    const summary = document.querySelectorAll(".emp-summary-card strong");
    if (summary[0]) summary[0].textContent = `${leave.approved} days`;
    if (summary[1]) summary[1].textContent = `${Math.max(0, 21 - leave.approved)} days`;
    if (summary[2]) summary[2].textContent = employee.department || "—";
    if (summary[3]) summary[3].textContent = employee.employmentStatus || "Active";

    const stats = document.querySelectorAll(".emp-profile-left .emp-stat b");
    if (stats[0]) stats[0].textContent = leave.approved;
    if (stats[1]) stats[1].textContent = Math.max(0, 21 - leave.approved);

    const payRows = document.querySelectorAll(".emp-files-col .emp-card:nth-child(2) .emp-pay-row .emp-pay-amt");
    if (payRows[0]) payRows[0].textContent = money(employee.salary);
    if (payRows[1]) payRows[1].textContent = payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—";
    if (payRows[2]) payRows[2].textContent = payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00";
    const total = document.querySelector(".emp-pay-total span:last-child");
    if (total) total.textContent = money(payroll.finalSalary ?? employee.salary);

    const headerSubtitle = document.querySelector(".emp-page-subtitle");
    if (headerSubtitle) headerSubtitle.textContent = `Welcome, ${employee.username}. Your employee information is loaded from the Modern Tech database.`;

    const crumb = document.querySelector(".emp-crumb");
    if (crumb) crumb.title = `Present: ${attendance.presentDays} | Absent: ${attendance.absentDays}`;
  }

  loadProfile().catch((error) => {
    console.error("Employee profile load error:", error);
    const message = document.createElement("div");
    message.className = "emp-profile-load-error";
    message.textContent = error.message;
    document.querySelector(".emp-page")?.prepend(message);
  });
})();
