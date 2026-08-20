(() => {
  "use strict";
  const token = localStorage.getItem("authToken");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("currentUser")) || {}; } catch {}
  if (!token || user.role !== "Staff" || !user.employeeId) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const formatDate = (value) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" }) : "—";

  async function load() {
    const box = document.getElementById("emp-my-leave-list");
    if (!box) return;
    try {
      const response = await fetch(`/api/attendance/employee/${encodeURIComponent(user.employeeId)}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load leave requests");
      const rows = data.leaveRequests || [];
      if (!rows.length) { box.innerHTML = '<p class="emp-leave-empty">You have not submitted any leave requests yet.</p>'; return; }
      box.innerHTML = `<div class="emp-leave-history">${rows.map((row) => { const cls = String(row.status || "Pending").toLowerCase(); return `<article class="emp-leave-row"><div class="emp-leave-marker"><span class="emp-leave-dot"></span></div><div class="emp-leave-date"><b>${escapeHtml(formatDate(row.date))}</b><span>${escapeHtml(row.reason || "Leave request")}</span></div><div class="emp-leave-col"><label>Type</label><strong>${escapeHtml(row.reason || "Leave request")}</strong></div><div class="emp-leave-col"><label>Approved By</label><strong>${cls === "approved" ? "HR" : "—"}</strong></div><div class="emp-leave-col"><label>Status</label><span class="emp-leave-status ${cls}"><i class="ri-${cls === "approved" ? "checkbox-circle-fill" : cls === "denied" ? "close-circle-fill" : "time-line"}"></i>${escapeHtml(row.status)}</span></div><button class="emp-leave-view" type="button" data-leave-date="${escapeHtml(row.date)}"><i class="ri-file-text-line"></i> View</button></article>`; }).join("")}</div>`;
      box.querySelectorAll("[data-leave-date]").forEach((button, index) => button.addEventListener("click", () => alert(`Leave request: ${rows[index].reason || "Leave request"}\nDate: ${formatDate(rows[index].date)}\nStatus: ${rows[index].status}`)));
    } catch (error) { box.innerHTML = `<p class="emp-leave-empty">${escapeHtml(error.message)}</p>`; }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true }); else load();
})();
