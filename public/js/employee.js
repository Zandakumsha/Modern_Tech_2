/* =========================================================
   Modern Tech - Employee Self-Service
   Connected to /api/employees
   ========================================================= */

(() => {
  "use strict";

  const API_BASE = "/api/employees";
  const DEFAULT_AVATAR =
    "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";

  let employeeId = null;
  let employee = null;

  const $ = (id) => document.getElementById(id);

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) ||
        JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  function getEmployeeId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Number(params.get("employeeId") || params.get("id"));
    if (Number.isInteger(fromUrl) && fromUrl > 0) return fromUrl;

    const user = getCurrentUser();
    const fromUser = Number(user?.employeeId);
    if (Number.isInteger(fromUser) && fromUser > 0) return fromUser;

    const fromStorage = Number(localStorage.getItem("employeeId"));
    if (Number.isInteger(fromStorage) && fromStorage > 0) return fromStorage;

    return null;
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        typeof data === "object" && data?.message
          ? data.message
          : `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function setText(id, value, fallback = "—") {
    const element = $(id);
    if (element) element.textContent = value ?? fallback;
  }

  function setValue(id, value) {
    const element = $(id);
    if (element) element.value = value ?? "";
  }

  function showToast(message, type = "success") {
    const toast = $("toast");
    const toastMessage = $("toast-message");

    if (!toast || !toastMessage) {
      console[type === "error" ? "error" : "log"](message);
      return;
    }

    toastMessage.textContent = message;
    toast.className = type;
    toast.style.display = "block";

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  function renderEmployee() {
    if (!employee) return;

    setText("emp-profile-name", employee.name, employee.name);
    setText("emp-profile-email", employee.contact, employee.contact);
    setText("emp-profile-position", employee.position);
    setText("emp-profile-department", employee.department);
    setText("emp-profile-id", `Employee ID: ${employee.employeeId}`);
    setText("emp-profile-history", employee.employmentHistory);

    // Common IDs used by the employee template.
    setText("emp-name", employee.name, employee.name);
    setText("emp-email", employee.contact, employee.contact);
    setText("emp-position", employee.position);
    setText("emp-department", employee.department);
    setText("emp-id", employee.employeeId);

    const nameInput = $("emp-edit-name");
    const emailInput = $("emp-edit-email");
    const positionInput = $("emp-edit-position");
    const departmentInput = $("emp-edit-department");

    if (nameInput) nameInput.value = employee.name || "";
    if (emailInput) emailInput.value = employee.contact || "";
    if (positionInput) positionInput.value = employee.position || "";
    if (departmentInput) departmentInput.value = employee.department || "";

    const user = getCurrentUser();
    const avatar = user?.avatar || localStorage.getItem("selectedAvatar") || DEFAULT_AVATAR;
    document.querySelectorAll("#navbarProfileImage, #employeeProfileImage").forEach((image) => {
      image.src = avatar;
    });
  }

  async function loadEmployee() {
    employeeId = getEmployeeId();

    if (!employeeId) {
      showToast("No employee ID was found. Open the employee page with ?employeeId=1.", "error");
      return;
    }

    localStorage.setItem("employeeId", String(employeeId));

    try {
      employee = await apiRequest(`${API_BASE}/${employeeId}`);
      renderEmployee();
      await Promise.allSettled([
        loadSummary(),
        loadPayroll(),
        loadAttendance(),
        loadLeave(),
      ]);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to load employee information.", "error");
    }
  }

  async function loadSummary() {
    if (!employeeId) return;
    try {
      const data = await apiRequest(`${API_BASE}/${employeeId}/summary`);
      const attendance = data.attendance || {};
      const leave = data.leave || {};
      const payroll = data.latestPayroll;

      setText("emp-leave-approved", leave.approvedRequests ?? 0, "0");
      setText("emp-leave-pending", leave.pendingRequests ?? 0, "0");
      setText("emp-present-days", attendance.presentDays ?? 0, "0");
      setText("emp-absent-days", attendance.absentDays ?? 0, "0");
      setText("emp-net-pay", payroll ? formatCurrency(payroll.finalSalary) : "—");

      // IDs from the redesigned employee page.
      const cards = document.querySelectorAll("[data-employee-summary]");
      cards.forEach((card) => {
        const field = card.dataset.employeeSummary;
        const value = {
          approvedLeave: leave.approvedRequests ?? 0,
          pendingLeave: leave.pendingRequests ?? 0,
          present: attendance.presentDays ?? 0,
          absent: attendance.absentDays ?? 0,
          salary: payroll ? formatCurrency(payroll.finalSalary) : "—",
        }[field];
        if (value !== undefined) card.textContent = value;
      });
    } catch (error) {
      console.error("Summary error:", error);
    }
  }

  async function loadPayroll() {
    if (!employeeId) return;
    try {
      const rows = await apiRequest(`${API_BASE}/${employeeId}/payroll`);
      const container = $("emp-payments-list") || $("emp-pay-list");
      if (!container) return;

      if (!rows.length) {
        container.innerHTML = '<p class="emp-empty">No payment records found.</p>';
        return;
      }

      container.innerHTML = rows.map((row) => `
        <div class="emp-payment-row">
          <div>
            <strong>${escapeHtml(formatDate(row.payPeriodEnd || row.payPeriodStart))}</strong>
            <small>${escapeHtml(`${row.hoursWorked ?? 0} hours · ${row.leaveDeductions ?? 0} leave deductions`)}</small>
          </div>
          <strong>${escapeHtml(formatCurrency(row.finalSalary))}</strong>
        </div>
      `).join("");

      const latest = rows[0];
      setText("emp-pay-total", formatCurrency(latest.finalSalary));
      setText("emp-latest-pay", formatCurrency(latest.finalSalary));
    } catch (error) {
      console.error("Payroll error:", error);
    }
  }

  async function loadAttendance() {
    if (!employeeId) return;
    try {
      const rows = await apiRequest(`${API_BASE}/${employeeId}/attendance`);
      const container = $("emp-attendance-list");
      if (!container) return;

      if (!rows.length) {
        container.innerHTML = '<p class="emp-empty">No attendance records found.</p>';
        return;
      }

      container.innerHTML = rows.slice(0, 20).map((row) => `
        <div class="emp-attendance-row">
          <span>${escapeHtml(formatDate(row.date))}</span>
          <strong class="${row.status === "Present" ? "is-present" : "is-absent"}">
            ${escapeHtml(row.status)}
          </strong>
        </div>
      `).join("");
    } catch (error) {
      console.error("Attendance error:", error);
    }
  }

  async function loadLeave() {
    if (!employeeId) return;
    try {
      const rows = await apiRequest(`${API_BASE}/${employeeId}/leave`);
      const container = $("emp-leave-list");
      if (!container) return;

      if (!rows.length) {
        container.innerHTML = '<p class="emp-empty">No leave requests found.</p>';
        return;
      }

      container.innerHTML = rows.map((row) => `
        <div class="emp-leave-row">
          <div>
            <strong>${escapeHtml(formatDate(row.date))}</strong>
            <small>${escapeHtml(row.reason)}</small>
          </div>
          <span class="emp-status emp-status-${String(row.status).toLowerCase()}">
            ${escapeHtml(row.status)}
          </span>
        </div>
      `).join("");
    } catch (error) {
      console.error("Leave error:", error);
    }
  }

  async function submitLeaveRequest(event) {
    event.preventDefault();

    if (!employeeId) {
      showToast("Employee information has not loaded yet.", "error");
      return;
    }

    const date = $("emp-leave-date")?.value;
    const reason = $("emp-leave-reason")?.value.trim();

    if (!date || !reason) {
      showToast("Please provide a date and reason for your leave.", "error");
      return;
    }

    const submitButton = event.submitter;
    if (submitButton) submitButton.disabled = true;

    try {
      await apiRequest(`${API_BASE}/${employeeId}/leave`, {
        method: "POST",
        body: JSON.stringify({ date, reason }),
      });

      event.target.reset();
      closeLeaveModal();
      await Promise.all([loadLeave(), loadSummary()]);
      showToast("Leave request submitted successfully.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to submit leave request.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!employeeId) return;

    const payload = {
      name: $("emp-edit-name")?.value.trim(),
      contact: $("emp-edit-email")?.value.trim(),
      position: $("emp-edit-position")?.value.trim(),
      department: $("emp-edit-department")?.value.trim(),
      salary: Number(employee.salary),
      employmentHistory: employee.employmentHistory || "",
    };

    if (!payload.name || !payload.contact || !payload.position || !payload.department) {
      showToast("Please complete all profile fields.", "error");
      return;
    }

    try {
      employee = await apiRequest(`${API_BASE}/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const user = getCurrentUser();
      if (user) {
        user.username = employee.name;
        user.email = employee.contact;
        user.employeeId = employee.employeeId;
        localStorage.setItem("currentUser", JSON.stringify(user));
        localStorage.setItem("user", JSON.stringify(user));
      }

      renderEmployee();
      closeEditProfile();
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to update profile.", "error");
    }
  }

  function openLeaveModal() {
    const modal = $("emp-leave-modal") || $("emp-leaveRequestModal");
    if (modal) {
      modal.hidden = false;
      modal.classList.add("active");
    }
  }

  function closeLeaveModal() {
    const modal = $("emp-leave-modal") || $("emp-leaveRequestModal");
    if (modal) {
      modal.classList.remove("active");
      modal.hidden = true;
    }
  }

  function openEditProfile() {
    const modal = $("emp-edit-modal");
    if (!modal) return;

    setValue("emp-edit-name", employee?.name);
    setValue("emp-edit-email", employee?.contact);
    setValue("emp-edit-position", employee?.position);
    setValue("emp-edit-department", employee?.department);

    modal.hidden = false;
    modal.classList.add("active");
  }

  function closeEditProfile() {
    const modal = $("emp-edit-modal");
    if (modal) {
      modal.classList.remove("active");
      modal.hidden = true;
    }
  }

  function bindEvents() {
    $("emp-leave-form")?.addEventListener("submit", submitLeaveRequest);
    $("emp-leaveRequestForm")?.addEventListener("submit", submitLeaveRequest);

    $("emp-request-leave-btn")?.addEventListener("click", openLeaveModal);
    $("emp-header-leave-btn")?.addEventListener("click", openLeaveModal);
    $("emp-open-leave")?.addEventListener("click", openLeaveModal);

    $("emp-close-leave")?.addEventListener("click", closeLeaveModal);
    $("emp-closeLeaveModal")?.addEventListener("click", closeLeaveModal);
    $("emp-cancel-leave")?.addEventListener("click", closeLeaveModal);

    $("emp-edit-profile-btn")?.addEventListener("click", openEditProfile);
    $("emp-save-profile")?.addEventListener("click", saveProfile);
    $("emp-edit-form")?.addEventListener("submit", saveProfile);
    $("emp-close-edit")?.addEventListener("click", closeEditProfile);
    $("emp-cancel-edit")?.addEventListener("click", closeEditProfile);

    $("emp-header-message-btn")?.addEventListener("click", () => {
      showToast("Messaging will be connected when the HR messages API is added.");
    });

    window.addEventListener("click", (event) => {
      const leaveModal = $("emp-leave-modal") || $("emp-leaveRequestModal");
      if (leaveModal && event.target === leaveModal) closeLeaveModal();

      const editModal = $("emp-edit-modal");
      if (editModal && event.target === editModal) closeEditProfile();
    });
  }

  async function init() {
    bindEvents();
    await loadEmployee();
  }

  window.EmployeeAPI = {
    loadEmployee,
    loadSummary,
    loadPayroll,
    loadAttendance,
    loadLeave,
    getEmployee: () => employee,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
