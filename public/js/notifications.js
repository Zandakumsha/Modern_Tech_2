(() => {
  "use strict";

  const list = document.getElementById("notifications-list");
  const count = document.getElementById("notification-count");
  const token = localStorage.getItem("authToken");
  const user = (() => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } })();
  let notifications = [];
  let filter = "all";
  let selectedRequest = null;

  if (!token || !["Admin", "Manager"].includes(user.role)) {
    window.location.replace("login.html");
    return;
  }

  const headers = () => ({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
  const typeLabel = type => type === "leave" ? "Leave Request" : "Employee Message";
  const typeIcon = type => type === "leave" ? "ri-calendar-event-line" : "ri-message-3-line";

  function payloadOf(notification) {
    if (!notification) return {};
    if (notification.payload && typeof notification.payload === "object") return notification.payload;
    if (typeof notification.payload === "string") {
      try { return JSON.parse(notification.payload) || {}; } catch { return {}; }
    }
    return {};
  }

  function render() {
    const visible = notifications.filter(n => filter === "all" || (filter === "unread" ? !Number(n.isRead) : n.type === filter));
    const unread = notifications.filter(n => !Number(n.isRead)).length;
    if (count) count.textContent = unread;
    if (!visible.length) {
      list.innerHTML = '<div class="notification-empty">No notifications found.</div>';
      return;
    }
    list.innerHTML = visible.map(n => `
      <article class="notification-card ${Number(n.isRead) ? "read" : "unread"}">
        <div class="notification-icon"><i class="${typeIcon(n.type)}"></i></div>
        <div class="notification-content">
          <div class="notification-top"><span class="notification-type">${escapeHtml(typeLabel(n.type))}</span><time>${new Date(n.createdAt).toLocaleString()}</time></div>
          <h3>${escapeHtml(n.title)}</h3>
          <p>${escapeHtml(n.message)}</p>
          ${n.employeeName ? `<small>From: ${escapeHtml(n.employeeName)}${n.employeeId ? ` (Employee ID: ${escapeHtml(n.employeeId)})` : ""}</small>` : ""}
        </div>
        <div class="notification-actions">
          ${n.type === "leave" ? `<button type="button" class="notification-view" data-view-request="${n.id}"><i class="ri-eye-line"></i> View Request</button>` : ""}
          <button type="button" class="notification-read" data-read="${n.id}">${Number(n.isRead) ? "Read" : "Mark as read"}</button>
        </div>
      </article>`).join("");
  }

  function renderLeavePreview(notification) {
    const p = payloadOf(notification);
    const value = key => escapeHtml(p[key] || "—");
    const category = Array.isArray(p.reasonCategories) && p.reasonCategories.length ? p.reasonCategories.join(", ") : [p.personal, p.vacation, p.juryAssignment].filter(Boolean).join(", ") || "—";
    const reasons = [p.personalReason, p.vacationReason, p.juryReason, p.reasonNotes].filter(Boolean).join(" | ") || "—";
    const employeeName = p.employeeName || notification.employeeName || "Employee";
    document.getElementById("leave-preview").innerHTML = `
      <div class="leave-preview-section"><div class="leave-preview-title">Employee Details</div><div class="leave-preview-grid">
        <div class="leave-preview-cell leave-preview-label">Name:</div><div class="leave-preview-cell">${escapeHtml(employeeName)}</div>
        <div class="leave-preview-cell leave-preview-label">Date:</div><div class="leave-preview-cell">${value("requestDate")}</div>
        <div class="leave-preview-cell leave-preview-label">Department:</div><div class="leave-preview-cell">${value("department")}</div>
        <div class="leave-preview-cell leave-preview-label">Supervisor:</div><div class="leave-preview-cell">${value("supervisor")}</div>
      </div></div>
      <div class="leave-preview-section"><div class="leave-preview-title">Time Requesting Off</div><div class="leave-preview-grid">
        <div class="leave-preview-cell leave-preview-label">Beginning On:</div><div class="leave-preview-cell">${value("startDate")}</div>
        <div class="leave-preview-cell leave-preview-label">Ending On:</div><div class="leave-preview-cell">${value("endDate")}</div>
        <div class="leave-preview-cell leave-preview-label">Days:</div><div class="leave-preview-cell">${value("days")}</div>
        <div class="leave-preview-cell leave-preview-label">Hours:</div><div class="leave-preview-cell">${value("hours")}</div>
        <div class="leave-preview-cell leave-preview-label">Return to Work:</div><div class="leave-preview-cell">${value("returnDate")}</div>
        <div class="leave-preview-cell leave-preview-label">Other:</div><div class="leave-preview-cell">${value("other")}</div>
        <div class="leave-preview-cell leave-preview-label">Notes:</div><div class="leave-preview-cell leave-preview-full">${value("notes")}</div>
      </div></div>
      <div class="leave-preview-section"><div class="leave-preview-title">Reason for Request</div><div class="leave-preview-grid">
        <div class="leave-preview-cell leave-preview-label">Category:</div><div class="leave-preview-cell leave-preview-full">${escapeHtml(category)}</div>
        <div class="leave-preview-cell leave-preview-label">Reason:</div><div class="leave-preview-cell leave-preview-full">${escapeHtml(reasons)}</div>
      </div></div>
      <div class="leave-preview-section"><div class="leave-preview-title">Employee Certification</div><div class="leave-preview-cert">I certify that the above is accurate. I recognize that this request is subject to the approval of management and company policies.</div><div class="leave-preview-sign"><div class="leave-preview-label">Employee Signature:</div><div><em>${escapeHtml(employeeName)}</em></div><div class="leave-preview-label">Date:</div><div>${value("requestDate")}</div></div></div>
      <div class="leave-preview-section"><div class="leave-preview-title">Employer Decision</div><div class="leave-preview-grid"><div class="leave-preview-cell">Approved</div><div class="leave-preview-cell">☐</div><div class="leave-preview-cell">Not Approved</div><div class="leave-preview-cell">☐</div></div></div>
      <div class="leave-preview-section"><div class="leave-preview-title">Supervisor / Management Signature</div><div class="leave-preview-sign"><div class="leave-preview-label">Signature:</div><div></div><div class="leave-preview-label">Date:</div><div>${value("managerDate")}</div><div class="leave-preview-label">Name Printed:</div><div>${value("managerName")}</div><div></div><div></div></div></div>`;
    document.getElementById("request-view-modal")?.classList.add("show");
  }

  function closeRequestView() {
    document.getElementById("request-view-modal")?.classList.remove("show");
    selectedRequest = null;
  }

  async function load() {
    try {
      const response = await fetch("/api/notifications", { headers: headers(), cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("authToken");
        window.location.replace("login.html");
        return;
      }
      if (!response.ok) throw new Error(data.message || "Unable to load notifications");
      notifications = data.notifications || [];
      render();
    } catch (error) {
      console.error(error);
      list.innerHTML = `<div class="notification-empty">Unable to load notifications: ${escapeHtml(error.message)}</div>`;
    }
  }

  list?.addEventListener("click", async event => {
    const viewButton = event.target.closest("[data-view-request]");
    if (viewButton) {
      selectedRequest = notifications.find(n => String(n.id) === viewButton.dataset.viewRequest);
      if (selectedRequest) {
        renderLeavePreview(selectedRequest);
        if (!Number(selectedRequest.isRead)) {
          try {
            await fetch(`/api/notifications/${selectedRequest.id}/read`, { method: "PATCH", headers: headers() });
            selectedRequest.isRead = 1;
            render();
          } catch (error) { console.error(error); }
        }
      }
      return;
    }

    const button = event.target.closest("[data-read]");
    if (!button) return;
    try {
      const response = await fetch(`/api/notifications/${button.dataset.read}/read`, { method: "PATCH", headers: headers() });
      if (!response.ok) throw new Error("Unable to mark notification as read");
      const item = notifications.find(n => String(n.id) === button.dataset.read);
      if (item) item.isRead = 1;
      render();
    } catch (error) { alert(error.message); }
  });

  document.querySelectorAll(".notification-filter").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".notification-filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    filter = button.dataset.filter;
    render();
  }));

  document.getElementById("mark-all-read")?.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/notifications/read-all", { method: "PATCH", headers: headers() });
      if (!response.ok) throw new Error("Unable to mark notifications as read");
      notifications.forEach(n => n.isRead = 1);
      render();
    } catch (error) { alert(error.message); }
  });

  document.getElementById("request-view-close")?.addEventListener("click", closeRequestView);
  document.getElementById("request-view-close-btn")?.addEventListener("click", closeRequestView);
  document.getElementById("request-view-modal")?.addEventListener("click", event => {
    if (event.target.id === "request-view-modal") closeRequestView();
  });
  document.getElementById("request-print-btn")?.addEventListener("click", () => {
    if (!selectedRequest) return;
    const preview = document.getElementById("leave-preview")?.innerHTML || "";
    const win = window.open("", "_blank", "width=1100,height=900");
    if (!win) { alert("Please allow pop-ups to print the request."); return; }
    win.document.write(`<html><head><title>Leave Request</title><style>body{font-family:Arial;margin:25px}.leave-preview-section{border:1px solid #ccc;margin-bottom:16px}.leave-preview-title{background:#050505;color:#fff;padding:8px;font-weight:bold;text-transform:uppercase}.leave-preview-grid{display:grid;grid-template-columns:180px 1fr 180px 1fr}.leave-preview-cell{padding:9px;border-right:1px solid #ccc;border-bottom:1px solid #ccc}.leave-preview-label{font-weight:bold;background:#fafafa}.leave-preview-full{grid-column:1/-1}.leave-preview-cert{text-align:center;font-style:italic;padding:14px}.leave-preview-sign{display:grid;grid-template-columns:210px 1fr 70px 220px}.leave-preview-sign>div{padding:9px;border-right:1px solid #ccc}</style></head><body>${preview}</body></html>`);
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300);
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k));
    ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k));
    window.location.replace("login.html");
  });

  load();
})();
