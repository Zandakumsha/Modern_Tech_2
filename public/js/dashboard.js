let tasks = [];
let currentTaskFilter = "";

function getCurrentUsername() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    return String(user?.username || sessionStorage.getItem("username") || "").trim();
  } catch {
    return String(sessionStorage.getItem("username") || "").trim();
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const greetingElement = document.getElementById("dashboard_greeting");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (greetingElement) greetingElement.textContent = `${greeting}, ${currentUser?.username || getCurrentUsername() || "User"}`;
}

async function taskRequest(url, options = {}) {
  const username = getCurrentUsername();
  if (!username) throw new Error("No logged-in username was found.");
  const separator = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${separator}username=${encodeURIComponent(username)}`, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(data?.error || data?.message || `Task request failed (${response.status})`);
  return data;
}

async function loadTasks() {
  try {
    tasks = (await taskRequest("/api/tasks")) || [];
    updateStats();
  } catch (error) {
    console.error("Unable to load tasks:", error);
    tasks = [];
    renderTaskError(error.message);
  }
}

function openModal() { openTaskModal(); }
function closeModal() {
  const modal = document.getElementById("dashboard_taskModal");
  modal?.classList.remove("active");
  document.getElementById("dashboard_taskForm")?.reset();
  if (modal) delete modal.dataset.editing;
}

const taskForm = document.getElementById("dashboard_taskForm");
if (taskForm) taskForm.addEventListener("submit", async e => {
  e.preventDefault();
  const title = document.getElementById("dashboard_taskTitle").value.trim();
  const status = document.getElementById("dashboard_taskStatus").value;
  const priority = document.getElementById("dashboard_taskPriority").value;
  const modal = document.getElementById("dashboard_taskModal");
  const editingId = modal.dataset.editing;
  const saveButton = taskForm.querySelector('button[type="submit"]');
  if (!title) return;

  try {
    if (saveButton) saveButton.disabled = true;
    const body = JSON.stringify({ title, status, priority });
    const saved = editingId
      ? await taskRequest(`/api/tasks/${encodeURIComponent(editingId)}`, { method: "PUT", body })
      : await taskRequest("/api/tasks", { method: "POST", body });
    if (editingId) tasks = tasks.map(task => task.id === saved.id ? saved : task);
    else tasks.unshift(saved);
    updateStats();
    closeModal();
  } catch (error) {
    console.error("Unable to save task:", error);
    alert(error.message || "Unable to save task.");
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
});

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => Boolean(task.completed)).length;
  const pending = total - completed;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set("dashboard_taskCount", pending);
  set("dashboard_totalTasks", total);
  set("dashboard_completedCount", completed);
  set("dashboard_pendingCount", pending);
  set("dashboard_completionRateValue", `${rate}%`);
  const progress = document.getElementById("dashboard_completionProgress");
  if (progress) progress.style.width = `${rate}%`;
  renderTasks();
}

function formatDueDate(value) {
  if (!value) return { date: "No date", sub: "Task" };
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { date: value, sub: "Task" };
  return { date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }), sub: "Created" };
}

function createTaskItem(task) {
  const item = document.createElement("div"); item.className = "dashboard_task-item";
  const timeline = document.createElement("div"); timeline.className = "dashboard_task-timeline";
  const dot = document.createElement("span"); dot.className = "dashboard_task-dot"; timeline.appendChild(dot); item.appendChild(timeline);
  const due = document.createElement("div"); due.className = "dashboard_task-due";
  const dueInfo = formatDueDate(task.dueDate); const dueStrong = document.createElement("strong"); dueStrong.textContent = dueInfo.date; due.appendChild(dueStrong);
  const dueSub = document.createElement("span"); dueSub.textContent = dueInfo.sub; due.appendChild(dueSub); item.appendChild(due);
  const info = document.createElement("div"); info.className = "dashboard_task-info";
  const title = document.createElement("strong"); title.className = "dashboard_task-title"; title.textContent = task.title; info.appendChild(title); item.appendChild(info);
  const type = document.createElement("div"); type.className = "dashboard_task-type"; type.textContent = task.type || "Work"; item.appendChild(type);
  const assignee = document.createElement("div"); assignee.className = "dashboard_task-assignee"; assignee.textContent = task.assignee || getCurrentUsername() || "—"; item.appendChild(assignee);
  const statusWrap = document.createElement("div"); statusWrap.className = "dashboard_task-status-wrap";
  const badge = document.createElement("span"); const statusClass = task.completed ? "completed" : task.status === "progress" ? "progress" : "pending";
  badge.className = `dashboard_task-badge dashboard_task-${statusClass}`; badge.textContent = task.completed ? "Completed" : task.status === "progress" ? "In Progress" : "On Hold"; statusWrap.appendChild(badge); item.appendChild(statusWrap);
  const completeLabel = document.createElement("label"); completeLabel.className = "dashboard_task-complete";
  completeLabel.title = task.completed ? "Move task back to On Hold" : "Mark task as completed";
  const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = Boolean(task.completed);
  checkbox.setAttribute("aria-label", task.completed ? `Move ${task.title} back to On Hold` : `Mark ${task.title} as completed`);
  checkbox.addEventListener("change", event => toggleTaskCompletion(task.id, event.target.checked));
  const checkmark = document.createElement("span"); checkmark.className = "dashboard_task-checkmark"; completeLabel.append(checkbox, checkmark); item.appendChild(completeLabel);
  const actions = document.createElement("div"); actions.className = "dashboard_task-actions";
  const editBtn = document.createElement("button"); editBtn.type = "button"; editBtn.className = "dashboard_task-action-btn"; editBtn.innerHTML = '<i class="ri-pencil-line"></i>'; editBtn.title = "Edit task"; editBtn.addEventListener("click", () => openTaskModal(task));
  const deleteBtn = document.createElement("button"); deleteBtn.type = "button"; deleteBtn.className = "dashboard_task-action-btn dashboard_task-delete-btn"; deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>'; deleteBtn.title = "Delete task"; deleteBtn.addEventListener("click", () => removeTask(task.id));
  actions.append(editBtn, deleteBtn); item.appendChild(actions); return item;
}

async function toggleTaskCompletion(id, completed) {
  try {
    const updated = await taskRequest(`/api/tasks/${encodeURIComponent(id)}/completion`, { method: "PATCH", body: JSON.stringify({ completed }) });
    tasks = tasks.map(task => task.id === updated.id ? updated : task); updateStats();
  } catch (error) { console.error("Unable to update task completion:", error); alert(error.message || "Unable to update task completion."); renderTasks(); }
}

function openTaskModal(task) {
  const modal = document.getElementById("dashboard_taskModal"); const form = document.getElementById("dashboard_taskForm");
  const titleInput = document.getElementById("dashboard_taskTitle"); const statusInput = document.getElementById("dashboard_taskStatus"); const priorityInput = document.getElementById("dashboard_taskPriority");
  if (!modal || !form || !titleInput || !statusInput || !priorityInput) return;
  if (task) { modal.dataset.editing = task.id; titleInput.value = task.title || ""; statusInput.value = task.status || "pending"; priorityInput.value = task.priority || "normal"; }
  else { delete modal.dataset.editing; form.reset(); }
  modal.classList.add("active"); titleInput.focus();
}

async function removeTask(id) {
  if (!confirm("Remove this task?")) return;
  try { await taskRequest(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }); tasks = tasks.filter(task => task.id !== id); updateStats(); }
  catch (error) { console.error("Unable to remove task:", error); alert(error.message || "Unable to remove task."); }
}

function renderTaskError(message) {
  [document.getElementById("dashboard_onHoldTasks"), document.getElementById("dashboard_completedTasks")].forEach(container => {
    if (!container) return; container.innerHTML = ""; const empty = document.createElement("div"); empty.className = "dashboard_empty-state"; empty.textContent = `Unable to load tasks: ${message}`; container.appendChild(empty);
  });
}

function renderTasks() {
  const onHoldContainer = document.getElementById("dashboard_onHoldTasks"); const completedContainer = document.getElementById("dashboard_completedTasks");
  if (!onHoldContainer || !completedContainer) return;
  onHoldContainer.innerHTML = ""; completedContainer.innerHTML = "";
  const filteredTasks = tasks.filter(task => !currentTaskFilter || String(task.title || "").toLowerCase().includes(currentTaskFilter));
  const onHoldTasks = filteredTasks.filter(task => !task.completed); const completedTasks = filteredTasks.filter(task => task.completed);
  if (!onHoldTasks.length) { const empty = document.createElement("div"); empty.className = "dashboard_empty-state"; empty.textContent = currentTaskFilter ? `No tasks match "${currentTaskFilter}".` : "No tasks on hold yet. Add one to get started."; onHoldContainer.appendChild(empty); }
  else onHoldTasks.forEach(task => onHoldContainer.appendChild(createTaskItem(task)));
  if (!completedTasks.length) { const empty = document.createElement("div"); empty.className = "dashboard_empty-state"; empty.textContent = currentTaskFilter ? `No tasks match "${currentTaskFilter}".` : "No completed tasks yet."; completedContainer.appendChild(empty); }
  else completedTasks.forEach(task => completedContainer.appendChild(createTaskItem(task)));
}

function applyTaskFilter(query) { currentTaskFilter = query.trim().toLowerCase(); renderTasks(); }
function setupDashboardInteractions() {
  const searchInput = document.querySelector(".search-bar input"); const searchButton = document.querySelector(".search-bar button"); const heroButton = document.querySelector(".hero-content button"); const overviewSection = document.querySelector(".z_banner");
  if (searchInput && searchButton) { searchButton.addEventListener("click", event => { event.preventDefault(); applyTaskFilter(searchInput.value); searchInput.focus(); }); searchInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); applyTaskFilter(searchInput.value); } }); }
  if (heroButton && overviewSection) heroButton.addEventListener("click", () => overviewSection.scrollIntoView({ behavior: "smooth", block: "start" }));
}

if (document.getElementById("dashboard_greeting")) updateGreeting();
if (document.getElementById("dashboard_totalTasks")) { setupDashboardInteractions(); loadTasks(); }
