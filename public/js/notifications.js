(() => {
  "use strict";

  const list = document.getElementById("notifications-list");
  const count = document.getElementById("notification-count");
  const token = localStorage.getItem("authToken");
  const user = (() => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } })();
  let notifications = [];
  let filter = "all";

  if (!token || !["Admin", "Manager"].includes(user.role)) {
    window.location.replace("login.html");
    return;
  }

  const headers = () => ({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
  const typeLabel = type => type === "leave" ? "Leave Request" : "Employee Message";
  const typeIcon = type => type === "leave" ? "ri-calendar-event-line" : "ri-message-3-line";

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
        <button type="button" class="notification-read" data-read="${n.id}">${Number(n.isRead) ? "Read" : "Mark as read"}</button>
      </article>`).join("");
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

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k));
    ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k));
    window.location.replace("login.html");
  });

  load();
})();
