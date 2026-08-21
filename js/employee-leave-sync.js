(() => {
  "use strict";
  const token = localStorage.getItem("authToken");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("currentUser")) || {}; } catch {}
  if (!token || user.role !== "Staff" || !user.employeeId) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const formatDate = (value) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
  const formatDecisionDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const statusIcon = (status) => status === "approved" ? "checkbox-circle-fill" : status === "denied" ? "close-circle-fill" : "time-line";

  async function load() {
    const box = document.getElementById("emp-my-leave-list");
    if (!box) return;
    try {
      const response = await fetch(`/api/attendance/employee/${encodeURIComponent(user.employeeId)}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load leave requests");
      const rows = data.leaveRequests || [];
      if (!rows.length) { box.innerHTML = '<p class="emp-leave-empty">You have not submitted any leave requests yet.</p>'; return; }
      box.innerHTML = `<div class="emp-leave-history">${rows.map((row) => {
        const cls = String(row.status || "Pending").toLowerCase();
        const decided = cls === "approved" || cls === "denied";
        const decisionLabel = cls === "approved" ? "Approved By" : cls === "denied" ? "Denied By" : "HR Decision";
        const decisionName = decided ? (row.decidedByName || "HR Manager") : "Pending";
        const decisionDate = decided ? formatDecisionDate(row.decidedAt) : "—";
        return `<article class="emp-leave-row">
          <div class="emp-leave-marker"><span class="emp-leave-dot"></span></div>
          <div class="emp-leave-date"><b>${escapeHtml(formatDate(row.date))}</b><span>${escapeHtml(row.reason || "Leave request")}</span></div>
          <div class="emp-leave-col"><label>Type</label><strong>${escapeHtml(row.reason || "Leave request")}</strong></div>
          <div class="emp-leave-col"><label>${decisionLabel}</label><strong>${escapeHtml(decisionName)}</strong>${decided ? `<small>Decision date: ${escapeHtml(decisionDate)}</small>` : ""}</div>
          <div class="emp-leave-col"><label>Status</label><span class="emp-leave-status ${cls}"><i class="ri-${statusIcon(cls)}"></i>${escapeHtml(row.status)}</span></div>
          <button class="emp-leave-view" type="button" data-leave-index="${rows.indexOf(row)}"><i class="ri-file-text-line"></i> View</button>
        </article>`;
      }).join("")}</div>`;
      box.querySelectorAll("[data-leave-index]").forEach((button) => button.addEventListener("click", () => showLeaveDetails(rows[Number(button.dataset.leaveIndex)])));
    } catch (error) { box.innerHTML = `<p class="emp-leave-empty">${escapeHtml(error.message)}</p>`; }
  }

  function showLeaveDetails(row) {
    const modal = document.getElementById("emp-leave-view-modal");
    const content = document.getElementById("emp-leave-view-content");
    if (!modal || !content) return;
    const cls = String(row.status || "Pending").toLowerCase();
    const decided = cls === "approved" || cls === "denied";
    const decisionLabel = cls === "approved" ? "Approved By" : cls === "denied" ? "Denied By" : "HR Decision";
    const decisionName = decided ? (row.decidedByName || "HR Manager") : "Pending";
    content.innerHTML = `<div class="emp-leave-detail-grid">
      <div><label>Leave Date</label><strong>${escapeHtml(formatDate(row.date))}</strong></div>
      <div><label>Reason</label><strong>${escapeHtml(row.reason || "Leave request")}</strong></div>
      <div><label>Status</label><strong class="emp-leave-status ${cls}">${escapeHtml(row.status)}</strong></div>
      <div><label>${decisionLabel}</label><strong>${escapeHtml(decisionName)}</strong></div>
      ${decided ? `<div><label>Date ${cls === "approved" ? "Approved" : "Denied"}</label><strong>${escapeHtml(formatDecisionDate(row.decidedAt))}</strong></div>` : ""}
      ${row.decidedByEmail ? `<div><label>HR Email</label><strong>${escapeHtml(row.decidedByEmail)}</strong></div>` : ""}
    </div>`;
    modal.classList.add("show");
  }

  function bindModal() {
    const modal = document.getElementById("emp-leave-view-modal");
    const close = () => modal?.classList.remove("show");
    document.getElementById("emp-leave-view-close")?.addEventListener("click", close);
    document.getElementById("emp-leave-view-close-btn")?.addEventListener("click", close);
    modal?.addEventListener("click", (event) => { if (event.target === modal) close(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { bindModal(); load(); }, { once: true });
  else { bindModal(); load(); }
})();
