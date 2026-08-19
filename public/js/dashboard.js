let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentTaskFilter = "";

function updateGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good Morning";
  if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
  else if (hour >= 18) greeting = "Good Evening";
  const greetingElement = document.getElementById("dashboard_greeting");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (greetingElement) greetingElement.textContent = `${greeting}, ${currentUser?.username || "User"}`;
}

function openModal() { openTaskModal(); }
function closeModal() {
  const modal = document.getElementById("dashboard_taskModal");
  modal?.classList.remove("active");
  document.getElementById("dashboard_taskForm")?.reset();
  if (modal) delete modal.dataset.editing;
}

const taskForm = document.getElementById("dashboard_taskForm");
if (taskForm) taskForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("dashboard_taskTitle").value.trim();
  const status = document.getElementById("dashboard_taskStatus").value;
  const priority = document.getElementById("dashboard_taskPriority").value;
  const completed = status === "completed";
  const modal = document.getElementById("dashboard_taskModal");
  const editingId = modal.dataset.editing;
  if (editingId) {
    const existingTask = tasks.find(task => task.id.toString() === editingId);
    if (existingTask) Object.assign(existingTask, { title, status, priority, completed });
  } else {
    tasks.push({ id: Date.now(), title, status, priority, completed, dueDate: new Date().toISOString().slice(0, 10), type: priority === "critical" ? "Urgent" : priority === "normal" ? "Work" : "General", assignee: JSON.parse(localStorage.getItem("currentUser") || "null")?.username || "—", notes: "" });
  }
  updateStats();
  closeModal();
});

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set("dashboard_taskCount", pending);
  set("dashboard_totalTasks", total);
  set("dashboard_completedCount", completed);
  set("dashboard_pendingCount", pending);
  set("dashboard_completionRateValue", `${rate}%`);
  const progress = document.getElementById("dashboard_completionProgress");
  if (progress) progress.style.width = `${rate}%`;
  renderTasks();
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function formatDueDate(value) {
  if (!value) return { date: "No due date", sub: "" };
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { date: value, sub: "" };
  return { date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }), sub: "" };
}

function createTaskItem(task) {
  const item = document.createElement("div");
  item.className = "dashboard_task-item";

  const timeline = document.createElement("div");
  timeline.className = "dashboard_task-timeline";
  const dot = document.createElement("span");
  dot.className = "dashboard_task-dot";
  timeline.appendChild(dot);
  item.appendChild(timeline);

  const due = document.createElement("div");
  due.className = "dashboard_task-due";
  const dueInfo = formatDueDate(task.dueDate);
  const dueStrong = document.createElement("strong");
  dueStrong.textContent = dueInfo.date;
  due.appendChild(dueStrong);
  const dueSub = document.createElement("span");
  dueSub.textContent = task.dueLabel || "Task";
  due.appendChild(dueSub);
  item.appendChild(due);

  const info = document.createElement("div");
  info.className = "dashboard_task-info";
  const title = document.createElement("strong");
  title.className = "dashboard_task-title";
  title.textContent = task.title;
  info.appendChild(title);
  item.appendChild(info);

  const type = document.createElement("div");
  type.className = "dashboard_task-type";
  type.textContent = task.type || (task.priority === "critical" ? "Urgent" : task.priority === "normal" ? "Work" : "General");
  item.appendChild(type);

  const assignee = document.createElement("div");
  assignee.className = "dashboard_task-assignee";
  assignee.textContent = task.assignee || "—";
  item.appendChild(assignee);

  const statusWrap = document.createElement("div");
  statusWrap.className = "dashboard_task-status-wrap";
  const badge = document.createElement("span");
  const statusClass = task.completed ? "completed" : task.status === "progress" ? "progress" : "pending";
  badge.className = `dashboard_task-badge dashboard_task-${statusClass}`;
  badge.textContent = task.completed ? "Completed" : task.status === "progress" ? "In Progress" : "On Hold";
  statusWrap.appendChild(badge);
  item.appendChild(statusWrap);

  const notes = document.createElement("button");
  notes.type = "button";
  notes.className = "dashboard_task-notes";
  notes.innerHTML = '<i class="ri-file-text-line"></i><span>Notes</span>';
  notes.addEventListener("click", () => {
    if (task.notes) alert(task.notes);
    else alert("No notes have been added to this task.");
  });
  item.appendChild(notes);

  const actions = document.createElement("div");
  actions.className = "dashboard_task-actions";
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "dashboard_task-action-btn";
  editBtn.innerHTML = '<i class="ri-pencil-line"></i>';
  editBtn.title = "Edit task";
  editBtn.addEventListener("click", () => openTaskModal(task));
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "dashboard_task-action-btn dashboard_task-delete-btn";
  deleteBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
  deleteBtn.title = "Delete task";
  deleteBtn.addEventListener("click", () => removeTask(task.id));
  actions.append(editBtn, deleteBtn);
  item.appendChild(actions);
  return item;
}

function toggleTaskCompletion(id, completed) {
  const task = tasks.find(task => task.id === id);
  if (!task) return;
  task.completed = completed;
  task.status = completed ? "completed" : "pending";
  updateStats();
}

function openTaskModal(task) {
  const modal = document.getElementById("dashboard_taskModal");
  const form = document.getElementById("dashboard_taskForm");
  const titleInput = document.getElementById("dashboard_taskTitle");
  const statusInput = document.getElementById("dashboard_taskStatus");
  const priorityInput = document.getElementById("dashboard_taskPriority");
  if (task) {
    modal.dataset.editing = task.id;
    titleInput.value = task.title;
    statusInput.value = task.status;
    priorityInput.value = task.priority;
  } else {
    delete modal.dataset.editing;
    form.reset();
  }
  modal.classList.add("active");
}

function removeTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  updateStats();
}

function renderTasks() {
  const onHoldContainer = document.getElementById("dashboard_onHoldTasks");
  const completedContainer = document.getElementById("dashboard_completedTasks");
  if (!onHoldContainer || !completedContainer) return;
  onHoldContainer.innerHTML = "";
  completedContainer.innerHTML = "";
  const filteredTasks = tasks.filter(task => !currentTaskFilter || task.title.toLowerCase().includes(currentTaskFilter));
  const onHoldTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);
  if (!onHoldTasks.length) {
    const empty = document.createElement("div");
    empty.className = "dashboard_empty-state";
    empty.textContent = currentTaskFilter ? `No tasks match "${currentTaskFilter}".` : "No tasks on hold yet. Add one to get started.";
    onHoldContainer.appendChild(empty);
  } else onHoldTasks.forEach(task => onHoldContainer.appendChild(createTaskItem(task)));
  if (!completedTasks.length) {
    const empty = document.createElement("div");
    empty.className = "dashboard_empty-state";
    empty.textContent = currentTaskFilter ? `No tasks match "${currentTaskFilter}".` : "No completed tasks yet.";
    completedContainer.appendChild(empty);
  } else completedTasks.forEach(task => completedContainer.appendChild(createTaskItem(task)));
}

function applyTaskFilter(query) { currentTaskFilter = query.trim().toLowerCase(); renderTasks(); }
function setupDashboardInteractions() {
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  const heroButton = document.querySelector(".hero-content button");
  const overviewSection = document.querySelector(".z_banner");
  if (searchInput && searchButton) {
    searchButton.addEventListener("click", event => { event.preventDefault(); applyTaskFilter(searchInput.value); searchInput.focus(); });
    searchInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); applyTaskFilter(searchInput.value); } });
  }
  if (heroButton && overviewSection) heroButton.addEventListener("click", () => overviewSection.scrollIntoView({ behavior: "smooth", block: "start" }));
}

if (document.getElementById("dashboard_greeting")) updateGreeting();
if (document.getElementById("dashboard_totalTasks")) { updateStats(); setupDashboardInteractions(); }
