/* Modern Tech - Employee Self-Service */
(() => {
  "use strict";

  const API_BASE = "/api/employees";
  const DEFAULT_AVATAR = "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";
  let employeeId = null;
  let employee = null;
  const $ = (id) => document.getElementById(id);

  function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof data === "object" && data?.message ? data.message : `Request failed (${response.status})`);
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }

  function setText(id, value, fallback = "—") {
    const element = $(id);
    if (element) element.textContent = value ?? fallback;
  }

  function showToast(message, type = "success") {
    const toast = $("toast");
    const messageElement = $("toast-message");
    if (!toast || !messageElement) { console[type === "error" ? "error" : "log"](message); return; }
    messageElement.textContent = message;
    toast.className = type;
    toast.style.display = "block";
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.style.display = "none"; }, 3000);
  }

  async function resolveCurrentEmployee() {
    const user = getCurrentUser();
    if (!user?.email) throw new Error("No signed-in email was found. Please sign in again.");

    employee = await apiRequest(`${API_BASE}/me?contact=${encodeURIComponent(user.email)}`);
    employeeId = employee.employeeId;

    // Cache the resolved ID only as a convenience. It is NOT used to choose another employee.
    localStorage.setItem("employeeId", String(employeeId));

    // Keep the signed-in browser account linked to the actual employee record.
    const updatedUser = { ...user, employeeId: employee.employeeId, username: employee.name, email: employee.contact, role: "Employee" };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }

  function renderEmployee() {
    if (!employee) return;
    setText("emp-profile-name", employee.name, "Employee");
    setText("emp-profile-email", employee.contact, "—");
    setText("emp-profile-position", employee.position);
    setText("emp-profile-department", employee.department);
    setText("emp-profile-id", `EMP${String(employee.employeeId).padStart(3, "0")}`);
    setText("emp-profile-history", employee.employmentHistory);
    setText("emp-username", employee.name, "My Profile");
    setText("sidebar-user-name", employee.name, "Employee");
    setText("sidebar-user-email", employee.contact, "—");
    setText("sidebar_role", "Employee");

    const avatar = getCurrentUser()?.avatar || localStorage.getItem("selectedAvatar") || DEFAULT_AVATAR;
    document.querySelectorAll("#navbarProfileImage").forEach((image) => { image.src = avatar; });
  }

  async function loadSummary() {
    const data = await apiRequest(`${API_BASE}/${employeeId}/summary`);
    const attendance = data.attendance || {};
    const leave = data.leave || {};
    const payroll = data.latestPayroll;
    setText("emp-leave-approved", leave.approvedRequests ?? 0, "0");
    setText("emp-leave-pending", leave.pendingRequests ?? 0, "0");
    setText("emp-present-days", attendance.presentDays ?? 0, "0");
    setText("emp-absent-days", attendance.absentDays ?? 0, "0");
    setText("emp-net-pay", payroll ? formatCurrency(payroll.finalSalary) : "—");
    document.querySelectorAll("[data-employee-summary]").forEach((element) => {
      const values = { approvedLeave: leave.approvedRequests ?? 0, pendingLeave: leave.pendingRequests ?? 0, present: attendance.presentDays ?? 0, absent: attendance.absentDays ?? 0, salary: payroll ? formatCurrency(payroll.finalSalary) : "—" };
      if (values[element.dataset.employeeSummary] !== undefined) element.textContent = values[element.dataset.employeeSummary];
    });
  }

  async function loadPayroll() {
    const rows = await apiRequest(`${API_BASE}/${employeeId}/payroll`);
    const container = $("emp-payments-list");
    if (!container) return;
    if (!rows.length) { container.innerHTML = '<p class="emp-empty">No payment records found.</p>'; return; }
    container.innerHTML = rows.map((row) => `<div class="emp-payment-row"><div><strong>${escapeHtml(formatDate(row.payPeriodEnd || row.payPeriodStart))}</strong><small>${escapeHtml(`${row.hoursWorked ?? 0} hours · ${row.leaveDeductions ?? 0} leave deductions`)}</small></div><strong>${escapeHtml(formatCurrency(row.finalSalary))}</strong></div>`).join("");
    setText("emp-pay-total", formatCurrency(rows[0].finalSalary));
  }

  async function loadAttendance() {
    const rows = await apiRequest(`${API_BASE}/${employeeId}/attendance`);
    const container = $("emp-attendance-list");
    if (!container) return;
    if (!rows.length) { container.innerHTML = '<p class="emp-empty">No attendance records found.</p>'; return; }
    container.innerHTML = rows.slice(0, 20).map((row) => `<div class="emp-attendance-row"><span>${escapeHtml(formatDate(row.date))}</span><strong>${escapeHtml(row.status)}</strong></div>`).join("");
  }

  async function loadLeave() {
    const rows = await apiRequest(`${API_BASE}/${employeeId}/leave`);
    const container = $("emp-leave-list");
    if (!container) return;
    if (!rows.length) { container.innerHTML = '<p class="emp-empty">No leave requests found.</p>'; return; }
    container.innerHTML = rows.map((row) => `<div class="emp-leave-row"><div><strong>${escapeHtml(formatDate(row.date))}</strong><small>${escapeHtml(row.reason)}</small></div><span class="emp-status emp-status-${String(row.status).toLowerCase()}">${escapeHtml(row.status)}</span></div>`).join("");
  }

  function openLeaveModal() { const modal = $("emp-leave-modal"); if (modal) { modal.hidden = false; modal.classList.add("active"); } }
  function closeLeaveModal() { const modal = $("emp-leave-modal"); if (modal) { modal.classList.remove("active"); modal.hidden = true; } }
  function openEditProfile() {
    const modal = $("emp-edit-modal");
    if (!modal) return;
    $("emp-edit-name").value = employee?.name || "";
    $("emp-edit-email").value = employee?.contact || "";
    $("emp-edit-position").value = employee?.position || "";
    $("emp-edit-department").value = employee?.department || "";
    modal.hidden = false; modal.classList.add("active");
  }
  function closeEditProfile() { const modal = $("emp-edit-modal"); if (modal) { modal.classList.remove("active"); modal.hidden = true; } }

  async function submitLeaveRequest(event) {
    event.preventDefault();
    const date = $("emp-leave-date")?.value;
    const reason = $("emp-leave-reason")?.value.trim();
    if (!date || !reason) return showToast("Please provide a leave date and reason.", "error");
    try {
      await apiRequest(`${API_BASE}/${employeeId}/leave`, { method: "POST", body: JSON.stringify({ date, reason }) });
      event.target.reset(); closeLeaveModal(); await Promise.all([loadLeave(), loadSummary()]); showToast("Leave request submitted successfully.");
    } catch (error) { showToast(error.message, "error"); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const payload = { name: $("emp-edit-name").value.trim(), contact: $("emp-edit-email").value.trim(), position: $("emp-edit-position").value.trim(), department: $("emp-edit-department").value.trim(), salary: Number(employee.salary), employmentHistory: employee.employmentHistory || "" };
    try {
      employee = await apiRequest(`${API_BASE}/${employeeId}`, { method: "PUT", body: JSON.stringify(payload) });
      const user = getCurrentUser();
      const updatedUser = { ...user, employeeId, username: employee.name, email: employee.contact, role: "Employee" };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser)); localStorage.setItem("user", JSON.stringify(updatedUser));
      renderEmployee(); closeEditProfile(); showToast("Profile updated successfully.");
    } catch (error) { showToast(error.message, "error"); }
  }

  async function init() {
    try {
      if (!sessionStorage.getItem("authenticated")) { window.location.href = "login.html"; return; }
      await resolveCurrentEmployee();
      renderEmployee();
      await Promise.all([loadSummary(), loadPayroll(), loadAttendance(), loadLeave()]);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to load your employee profile.", "error");
    }

    $("emp-header-leave-btn")?.addEventListener("click", openLeaveModal);
    $("emp-sidebar-leave")?.addEventListener("click", (event) => { event.preventDefault(); openLeaveModal(); });
    $("emp-open-leave")?.addEventListener("click", openLeaveModal);
    $("emp-close-leave")?.addEventListener("click", closeLeaveModal);
    $("emp-cancel-leave")?.addEventListener("click", closeLeaveModal);
    $("emp-leave-form")?.addEventListener("submit", submitLeaveRequest);
    $("emp-edit-profile-btn")?.addEventListener("click", openEditProfile);
    $("emp-close-edit")?.addEventListener("click", closeEditProfile);
    $("emp-cancel-edit")?.addEventListener("click", closeEditProfile);
    $("emp-edit-form")?.addEventListener("submit", saveProfile);
    $("emp-header-message-btn")?.addEventListener("click", () => showToast("HR messaging will be connected next."));
    $("emp-send-message-btn")?.addEventListener("click", () => showToast("HR messaging will be connected next."));
  }

  window.EmployeeAPI = { loadEmployee: init, loadSummary, loadPayroll, loadAttendance, loadLeave, getEmployee: () => employee };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
