(() => {
  "use strict";

  let attendanceChart = null;

  const $ = (id) => document.getElementById(id);

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
      const text = `${request.name || ""} ${request.reason || ""}`.toLowerCase();
      return (!search || text.includes(search)) && (status === "all" || request.status.toLowerCase() === status);
    });

    $("leaveCount").textContent = `${rows.length} request${rows.length === 1 ? "" : "s"}`;
    $("leaveList").innerHTML = rows.map((request) => `
      <div class="s_leave_item" style="padding:14px 0;border-bottom:1px solid var(--border, #ddd)">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
          <strong>${request.name || "Unknown employee"}</strong>
          <span class="s_stamp ${stampClass(request.status)}"><i class="${statusIcon(request.status)}"></i>${request.status}</span>
        </div>
        <div>${formatDateLong(request.date)} · ${request.reason || "No reason provided"}</div>
        ${request.status === "Pending" ? `<div style="margin-top:8px;display:flex;gap:8px"><button class="s_btn_primary" data-leave-action="Approved" data-request-id="${request.requestId}">Approve</button><button class="s_filter_reset" data-leave-action="Denied" data-request-id="${request.requestId}">Deny</button></div>` : ""}
      </div>
    `).join("");

    $("leaveEmpty").classList.toggle("s_hidden", rows.length !== 0);
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

  async function refresh() {
    await loadData();
    renderStats();
    renderChart();
    renderAttendance();
    renderLeave();
  }

  function bind() {
    $("attSearch")?.addEventListener("input", renderAttendance);
    $("attAbsenceOnly")?.addEventListener("change", renderAttendance);
    $("attReset")?.addEventListener("click", () => { $("attSearch").value = ""; $("attAbsenceOnly").checked = false; renderAttendance(); });
    $("leaveSearch")?.addEventListener("input", renderLeave);
    $("leaveStatus")?.addEventListener("change", renderLeave);
    $("leaveReset")?.addEventListener("click", () => { $("leaveSearch").value = ""; $("leaveStatus").value = "all"; renderLeave(); });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-leave-action]");
      if (!button) return;
      updateLeave(Number(button.dataset.requestId), button.dataset.leaveAction);
    });

    const tabs = [
      ["tabBtnAttendance", "panelAttendance"],
      ["tabBtnLeave", "panelLeave"],
    ];
    tabs.forEach(([buttonId, panelId]) => {
      $(buttonId)?.addEventListener("click", () => {
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
