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
  const initials = (name) => String(name || "Employee").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    localStorage.removeItem("employeeId");
    window.location.replace("login.html");
  }

  function openPanel(id) {
    const panel = byId(id);
    if (!panel) return;
    panel.hidden = !panel.hidden;
  }

  function openModal(id) {
    const modal = byId(id);
    if (modal) modal.style.display = "flex";
  }

  function closeModal(id) {
    const modal = byId(id);
    if (modal) modal.style.display = "none";
  }

  function setupButtons() {
    byId("logout-btn")?.addEventListener("click", logout);

    const messageButtons = ["emp-header-message-btn", "emp-send-message-btn", "emp-send-message-link"];
    messageButtons.forEach((id) => byId(id)?.addEventListener("click", (event) => {
      event.preventDefault();
      openModal("emp-message-modal");
    }));

    const leaveButtons = ["emp-header-leave-btn", "emp-request-leave-link"];
    leaveButtons.forEach((id) => byId(id)?.addEventListener("click", (event) => {
      event.preventDefault();
      openModal("emp-leave-modal");
    }));

    byId("emp-cancel-message")?.addEventListener("click", () => closeModal("emp-message-modal"));
    byId("emp-close-message-modal")?.addEventListener("click", () => closeModal("emp-message-modal"));
    byId("emp-cancel-leave")?.addEventListener("click", () => closeModal("emp-leave-modal"));
    byId("emp-close-leave-modal")?.addEventListener("click", () => closeModal("emp-leave-modal"));

    byId("emp-message-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Your message has been submitted to HR.");
      event.target.reset();
      closeModal("emp-message-modal");
    });

    byId("emp-leave-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      alert("Your leave request has been submitted.");
      event.target.reset();
      closeModal("emp-leave-modal");
    });

    byId("theme-button")?.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      localStorage.setItem("employeeTheme", document.body.classList.contains("dark-theme") ? "dark" : "light");
    });

    if (localStorage.getItem("employeeTheme") === "dark") document.body.classList.add("dark-theme");

    document.querySelectorAll(".emp-modal").forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.style.display = "none";
    }));

    byId("emp-leave-from")?.addEventListener("change", calculateLeaveDays);
    byId("emp-leave-to")?.addEventListener("change", calculateLeaveDays);
  }

  function calculateLeaveDays() {
    const from = byId("emp-leave-from")?.value;
    const to = byId("emp-leave-to")?.value;
    const days = byId("emp-leave-days");
    if (!days || !from || !to) return;
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const difference = Math.round((end - start) / 86400000) + 1;
    days.value = difference > 0 ? difference : 0;
  }

  async function loadProfile() {
    const response = await fetch("/api/employees/me", { headers: { Authorization: `Bearer ${token}` } });
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
    setText("account-username", employee.username);
    setText("account-email", employee.email);
    setText("account-id", employee.employeeId);
    setText("salary-value", money(employee.salary));
    setText("hours-value", payroll.hoursWorked ? `${payroll.hoursWorked} hrs` : "—");
    setText("deductions-value", payroll.leaveDeductions ? `−${money(payroll.leaveDeductions)}` : "R0.00");
    setText("net-pay-value", money(payroll.finalSalary ?? employee.salary));
    setText("present-days", attendance.presentDays);
    setText("absent-days", attendance.absentDays);
    setText("approved-leave", leave.approved);
    setText("pending-leave", leave.pending);
    setText("denied-leave", leave.denied);

    const avatar = byId("emp-profile-avatar");
    if (avatar) avatar.textContent = initials(employee.name);

    const info = document.querySelectorAll(".emp-profile-right .emp-info-item > div");
    [employee.employeeId, employee.employmentHistory || "Not recorded", employee.phone, employee.department, employee.position, employee.employmentType, employee.manager, employee.employmentStatus].forEach((value, index) => {
      if (info[index]) info[index].textContent = value ?? "—";
    });

    const summary = document.querySelectorAll(".emp-summary-card strong");
    if (summary[0]) summary[0].textContent = `${leave.approved} days`;
    if (summary[1]) summary[1].textContent = `${Math.max(0, 21 - leave.approved)} days`;
    if (summary[2]) summary[2].textContent = employee.department || "—";
    if (summary[3]) summary[3].textContent = employee.employmentStatus || "Active";

    const stats = document.querySelectorAll(".emp-profile-left .emp-stat b");
    if (stats[0]) stats[0].textContent = leave.approved;
    if (stats[1]) stats[1].textContent = Math.max(0, 21 - leave.approved);

    const headerSubtitle = document.querySelector(".emp-page-subtitle");
    if (headerSubtitle) headerSubtitle.textContent = `Welcome, ${employee.username}. Your employee information is loaded from the Modern Tech database.`;
  }

  setupButtons();
  loadProfile().catch((error) => {
    console.error("Employee profile load error:", error);
    const message = document.createElement("div");
    message.className = "emp-profile-load-error";
    message.textContent = error.message;
    document.querySelector(".emp-page")?.prepend(message);
  });
})();
