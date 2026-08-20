(() => {
  "use strict";

  let attendanceChart = null;
  let activeTab = "attendance";

  const $ = (id) => document.getElementById(id);
  const user = () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  };

  function employeeName(id) {
    return EMPLOYEES.find((e) => Number(e.employeeId) === Number(id))?.name || "Unknown employee";
  }

  function attendanceForEmployee(employee) {
    return employee.attendance || [];
  }

  function renderStats() {
    const records = EMPLOYEES.flatMap((e) => attendanceForEmployee(e));
    const present = records.filter((r) => r.status === "Present").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const pending = ALL_LEAVE.filter((r) => r.status === "Pending").length;
    const total = present + absent;

    $("statsRow").innerHTML = `
      <div class="s_stat_card"><span class="s_stat_label">Employees</span><strong>${EMPLOYEES.length}</strong></div>
      <div class="s_stat_card"><span class="s_stat_label">Present</span><strong>${present}</strong></div>
      <div class="s_stat_card"><span class="s_stat_label">Absent</span><strong>${absent}</strong></div>
      <div class="s_stat_card"><span class="s_stat_label">Pending Leave</span><strong>${pending}</strong></div>
      <div class="s_stat_card"><span class="s_stat_label">Attendance Rate</span><strong>${total ? Math.round((present / total) * 100) : 0}%</strong></div>
    `;
  }

  function renderChart() {
    const canvas = $("attendanceChart");
    if (!canvas || typeof Chart === "undefined") return;

    const dates = ALL_DATES.slice(-14);
    const present = dates.map((date) => EMPLOYEES.flatMap((e) => e.attendance || []).filter((r) => r.date === date && r.status === "Present").length);
    const absent = dates.map((date) => EMPLOYEES.flatMap((e) => e.attendance || []).filter((r) => r.date === date && r.status === "Absent").length);

    if (attendanceChart) attendanceChart.destroy();
    attendanceChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: dates.map((d) => `${weekdayShort(d)} ${dayNum(d)}`),
        datasets: [
          { label: "Present", data: present, tension: 0.3 },
          { label: "Absent", data: absent, tension: 0.3 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
  }

  function renderAttendance() {
    const search = ($("attSearch")?.value || "").toLowerCase().trim();
    const absenceOnly = $("attAbsenceOnly")?.checked;
    const employees = EMPLOYEES.filter((employee) => {
      const matchesName = employee.name.toLowerCase().includes(search);
      const hasAbsence = (employee.attendance || []).some((r) => r.status === "Absent");
      return matchesName && (!absenceOnly || hasAbsence);
    });

    const dates = ALL_DATES.slice(-14);
    $("attHeadRow").innerHTML = `<th>Employee</th>${dates.map((d) => `<th>${weekdayShort(d)}<br>${dayNum(d)}</th>`).join("")}`;
    $("attBody").innerHTML = employees.map((employee) => {
      const rows = Object.fromEntries((employee.attendance || []).map((r) => [r.date, r.status]));
      return `<tr><td><strong>${employee.name}</strong><br><small>${employee.position || ""}</small></td>${dates.map((date) => {
        const status = rows[date] || "—";
        return `<td><span class="s_stamp ${status === "Present" ? "s_stamp_approved" : status === "Absent" ? "s_stamp_absent" : "s_stamp_pending"}">${status}</span></td>`;
      }).join("")}</tr>`;
    }).join("");

    $("attCount").textContent = `${employees.length} employee${employees.length === 1 ? "" : "s"}`;
    $("attEmpty").classList.toggle("s_hidden", employees.length !== 0);
  }

  function renderLeave() {
    const search = ($("leaveSearch")?.value || "").toLowerCase().trim();
    const status = $("leaveStatus")?.value || "all";
    const rows = ALL_LEAVE.filter((request) => {
      const text = `${request.name || employeeName(request.employeeId)} ${request.reason || ""}`.toLowerCase();
      return (!search || text.includes(search)) && (status === "all" || request.status.toLowerCase() === status);
    });

    $("leaveCount").textContent = `${rows.length} request${rows.length === 1 ? "" : "s"}`;
    $("leaveList").innerHTML = rows.map((request) => `
      <div class="s_leave_item" style="padding:14px 0;border-bottom:1px solid var(--border, #ddd)">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
          <strong>${request.name || employeeName(request.employeeId)}</strong>
          <span class="s_stamp ${stampClass(request.status)}"><i class="${statusIcon(request.status)}"></i>${request.status}</span>
        </div>
        <div>${formatDateLong(request.date)} · ${request.reason || "No reason provided"}</div>
        ${request.status === "Pending" ? `<div style="margin-top:8px;display:flex;gap:8px"><button class="s_btn_primary" data-leave-action="Approved" data-request-id="${request.requestId}">Approve</button><button class="s_filter_reset" data-leave-action="Denied" data-request-id="${request.requestId}">Deny</button></div>` : ""}
      </div>
    `).join("");

    $("leaveEmpty").classList.toggle("s_hidden", rows.length !== 0);
  }

  function populateEmployeeSelect() {
    const select = $("to_employee");
    if (!select) return;
    select.innerHTML = `<option value="">Select employee…</option>` + EMPLOYEES.map((e) => `<option value="${e.employeeId}">${e.name}</option>`).join("");
    const current = user().employeeId;
    if (current) select.value = String(current);
  }

  function renderTimeOff() {
    const pending = ALL_LEAVE.filter((r) => r.status === "Pending");
    $("pendingBadge").textContent = pending.length;
    $("pendingList").innerHTML = pending.length ? pending.map((r) => `
      <div style="padding:10px 0;border-bottom:1px solid var(--border, #ddd)">
        <strong>${r.name || employeeName(r.employeeId)}</strong><br>
        <small>${formatDateLong(r.date)} · ${r.reason || "No reason"}</small>
        <div style="margin-top:7px;display:flex;gap:7px"><button class="s_btn_primary" data-leave-action="Approved" data-request-id="${r.requestId}">Approve</button><button class="s_filter_reset" data-leave-action="Denied" data-request-id="${r.requestId}">Deny</button></div>
      </div>`).join("") : `<p class="s_pending_empty_note">No pending requests</p>`;

    $("toAllCount").textContent = `${ALL_LEAVE.length} request${ALL_LEAVE.length === 1 ? "" : "s"}`;
    $("toAllList").innerHTML = ALL_LEAVE.map((r) => `<div style="padding:10px 0;border-bottom:1px solid var(--border, #ddd)"><strong>${r.name || employeeName(r.employeeId)}</strong> · ${formatDateLong(r.date)} · ${r.reason || "No reason"} <span class="s_stamp ${stampClass(r.status)}">${r.status}</span></div>`).join("");
    $("toEmpty").classList.toggle("s_hidden", ALL_LEAVE.length !== 0);
  }

  async function refresh() {
    await loadData();
    renderStats();
    renderChart();
    renderAttendance();
    renderLeave();
    populateEmployeeSelect();
    renderTimeOff();
  }

  async function submitLeave() {
    const error = $("to_error");
    error.textContent = "";
    const employeeId = Number($("to_employee").value);
    const type = $("to_type").value;
    const startDate = $("to_start").value;
    const endDate = $("to_end").value;
    const reason = $("to_reason").value.trim();

    if (!employeeId || !type || !startDate || !endDate) {
      error.textContent = "Please select an employee, leave type, start date and end date.";
      return;
    }
    if (startDate > endDate) {
      error.textContent = "End date cannot be before start date.";
      return;
    }

    try {
      await apiFetch("/api/attendance/leave", {
        method: "POST",
        body: JSON.stringify({ employeeId, startDate, endDate, type, reason }),
      });
      $("to_reason").value = "";
      $("to_start").value = "";
      $("to_end").value = "";
      showToast("Leave request submitted successfully");
      await refresh();
    } catch (err) {
      error.textContent = err.message;
    }
  }

  async function updateLeave(requestId, status) {
    try {
      await apiFetch(`/api/attendance/leave/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      showToast(`Leave request ${status.toLowerCase()}`);
      await refresh();
    } catch (err) {
      showToast(err.message);
    }
  }

  function bind() {
    $("attSearch")?.addEventListener("input", renderAttendance);
    $("attAbsenceOnly")?.addEventListener("change", renderAttendance);
    $("attReset")?.addEventListener("click", () => { $("attSearch").value = ""; $("attAbsenceOnly").checked = false; renderAttendance(); });
    $("leaveSearch")?.addEventListener("input", renderLeave);
    $("leaveStatus")?.addEventListener("change", renderLeave);
    $("leaveReset")?.addEventListener("click", () => { $("leaveSearch").value = ""; $("leaveStatus").value = "all"; renderLeave(); });
    $("to_submit")?.addEventListener("click", submitLeave);

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-leave-action]");
      if (!button) return;
      updateLeave(Number(button.dataset.requestId), button.dataset.leaveAction);
    });

    const tabs = [
      ["tabBtnAttendance", "panelAttendance", "attendance"],
      ["tabBtnLeave", "panelLeave", "leave"],
      ["tabBtnTimeOff", "panelTimeOff", "timeoff"],
    ];
    tabs.forEach(([buttonId, panelId, tab]) => {
      $(buttonId)?.addEventListener("click", () => {
        activeTab = tab;
        tabs.forEach(([b, p]) => {
          $(b)?.classList.toggle("s_active", b === buttonId);
          $(b)?.setAttribute("aria-selected", b === buttonId ? "true" : "false");
          $(p)?.classList.toggle("s_hidden", p !== panelId);
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bind();
    try {
      await refresh();
    } catch (error) {
      console.error("Attendance API error:", error);
      showLoadError(error);
    }
  });
})();
