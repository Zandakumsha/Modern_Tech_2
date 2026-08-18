(() => {
  const list = document.getElementById("notifications-list");
  const count = document.getElementById("notification-count");
  let notifications = [];
  let filter = "all";

  const escapeHtml = value => String(value ?? "").replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
  const icon = type => type === "leave" ? "ri-calendar-event-line" : "ri-message-3-line";
  const title = type => type === "leave" ? "Leave Request" : "Employee Message";

  function render() {
    const visible = notifications.filter(n => filter === "all" || (filter === "unread" ? !Number(n.isRead) : n.type === filter));
    const unread = notifications.filter(n => !Number(n.isRead)).length;
    if (count) count.textContent = unread;
    if (!visible.length) { list.innerHTML = '<div class="notification-empty">No notifications found.</div>'; return; }
    list.innerHTML = visible.map(n => `<article class="notification-card ${Number(n.isRead) ? "read" : "unread"}" data-id="${n.id}"><div class="notification-icon"><i class="${icon(n.type)}"></i></div><div class="notification-content"><div class="notification-top"><span class="notification-type">${escapeHtml(title(n.type))}</span><time>${new Date(n.createdAt).toLocaleString()}</time></div><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.message)}</p>${n.employeeName ? `<small>From: ${escapeHtml(n.employeeName)}${n.employeeId ? ` (Employee ID: ${escapeHtml(n.employeeId)})` : ""}</small>` : ""}</div><button class="notification-read" data-read="${n.id}" title="Mark as read">${Number(n.isRead) ? "Read" : "Mark as read"}</button></article>`).join("");
  }

  async function load() {
    try { const response = await fetch("/api/notifications"); const data = await response.json(); if (!response.ok) throw new Error(data.message); notifications = data.notifications || []; render(); }
    catch (error) { list.innerHTML = `<div class="notification-empty">Unable to load notifications: ${escapeHtml(error.message)}</div>`; }
  }

  list?.addEventListener("click", async event => {
    const button = event.target.closest("[data-read]"); if (!button) return;
    try { await fetch(`/api/notifications/${button.dataset.read}/read`, { method: "PATCH" }); const item = notifications.find(n => String(n.id) === button.dataset.read); if (item) item.isRead = 1; render(); } catch (error) { console.error(error); }
  });

  document.querySelectorAll(".notification-filter").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".notification-filter").forEach(b => b.classList.remove("active")); button.classList.add("active"); filter = button.dataset.filter; render(); }));
  document.getElementById("mark-all-read")?.addEventListener("click", async () => { await fetch("/api/notifications/read-all", { method: "PATCH" }); notifications.forEach(n => n.isRead = 1); render(); });
  document.getElementById("logout-btn")?.addEventListener("click", () => { ["authToken","currentUser","user","employeeId"].forEach(k => localStorage.removeItem(k)); window.location.replace("login.html"); });
  document.getElementById("theme-button")?.addEventListener("click", () => document.body.classList.toggle("dark-theme"));
  load();
})();
