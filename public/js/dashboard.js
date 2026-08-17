let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentTaskFilter = "";

function updateGreeting() {
  const hour = new Date().getHours();

  let greeting = "Good Morning";

  if (hour >= 12 && hour < 18) {
    greeting = "Good Afternoon";
  } else if (hour >= 18) {
    greeting = "Good Evening";
  }

  const greetingElement = document.getElementById("dashboard_greeting");

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (greetingElement) {
    greetingElement.textContent = `${greeting}, ${currentUser?.username || "User"}`;
  }
}

function openModal() {
  openTaskModal();
}

function closeModal() {
  document.getElementById("dashboard_taskModal").classList.remove("active");

  const form = document.getElementById("dashboard_taskForm");
  form.reset();
  delete document.getElementById("dashboard_taskModal").dataset.editing;
}

const taskForm = document.getElementById("dashboard_taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("dashboard_taskTitle").value;
    const status = document.getElementById("dashboard_taskStatus").value;
    const priority = document.getElementById("dashboard_taskPriority").value;
    const completed = status === "completed";
    const modal = document.getElementById("dashboard_taskModal");
    const editingId = modal.dataset.editing;

    if (editingId) {
      const existingTask = tasks.find(
        (task) => task.id.toString() === editingId,
      );
      if (existingTask) {
        existingTask.title = title;
        existingTask.status = status;
        existingTask.priority = priority;
        existingTask.completed = completed;
      }
    } else {
      tasks.push({
        id: Date.now(),
        title,
        status,
        priority,
        completed,
      });
    }

    updateStats();
    closeModal();
  });
}

function updateStats() {
  const total = tasks.length;

  const completed = tasks.filter((task) => task.completed).length;

  const pending = total - completed;

  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("dashboard_taskCount").textContent = pending;

  document.getElementById("dashboard_totalTasks").textContent = total;

  document.getElementById("dashboard_completedCount").textContent = completed;

  document.getElementById("dashboard_pendingCount").textContent = pending;

  document.getElementById("dashboard_completionRateValue").textContent =
    `${rate}%`;

  document.getElementById("dashboard_completionProgress").style.width =
    `${rate}%`;

  renderTasks();

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function createTaskItem(task) {
  const item = document.createElement("div");
  item.className = "dashboard_task-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "dashboard_task-checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () =>
    toggleTaskCompletion(task.id, checkbox.checked),
  );
  item.appendChild(checkbox);

  const left = document.createElement("div");
  left.className = "dashboard_task-left";

  const marker = document.createElement("span");
  marker.className = `dashboard_task-status-dot dashboard_task-${task.status}`;
  left.appendChild(marker);

  const info = document.createElement("div");
  info.className = "dashboard_task-info";

  const title = document.createElement("strong");
  title.className = "dashboard_task-title";
  title.textContent = task.title;
  if (task.completed) title.classList.add("completed");
  info.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "dashboard_task-meta";

  const statusBadge = document.createElement("span");
  statusBadge.className = `dashboard_task-badge dashboard_task-${task.status}`;
  statusBadge.textContent = task.completed
    ? "Completed"
    : task.status === "progress"
      ? "In Progress"
      : "Pending";

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `dashboard_task-priority dashboard_task-${task.priority}`;
  priorityBadge.textContent =
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  meta.appendChild(statusBadge);
  meta.appendChild(priorityBadge);
  info.appendChild(meta);
  left.appendChild(info);
  item.appendChild(left);

  const right = document.createElement("div");
  right.className = "dashboard_task-right";

  const avatar = document.createElement("div");
  avatar.className = "dashboard_task-avatar";
  avatar.textContent = task.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
  right.appendChild(avatar);

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

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  right.appendChild(actions);
  item.appendChild(right);

  return item;
}

function toggleTaskCompletion(id, completed) {
  const task = tasks.find((task) => task.id === id);
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
  tasks = tasks.filter((task) => task.id !== id);
  updateStats();
}

function renderTasks() {
  const onHoldContainer = document.getElementById("dashboard_onHoldTasks");
  const completedContainer = document.getElementById(
    "dashboard_completedTasks",
  );

  if (!onHoldContainer || !completedContainer) return;

  onHoldContainer.innerHTML = "";
  completedContainer.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    if (!currentTaskFilter) return true;
    return task.title.toLowerCase().includes(currentTaskFilter);
  });

  const onHoldTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  if (onHoldTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dashboard_empty-state";
    empty.textContent = currentTaskFilter
      ? `No tasks match "${currentTaskFilter}".`
      : "No pending tasks yet. Add one to get started.";
    onHoldContainer.appendChild(empty);
  } else {
    onHoldTasks.forEach((task) =>
      onHoldContainer.appendChild(createTaskItem(task)),
    );
  }

  if (completedTasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dashboard_empty-state";
    empty.textContent = currentTaskFilter
      ? `No tasks match "${currentTaskFilter}".`
      : "No completed tasks yet.";
    completedContainer.appendChild(empty);
  } else {
    completedTasks.forEach((task) =>
      completedContainer.appendChild(createTaskItem(task)),
    );
  }
}

function applyTaskFilter(query) {
  currentTaskFilter = query.trim().toLowerCase();
  renderTasks();
}

function setupDashboardInteractions() {
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  const heroButton = document.querySelector(".hero-content button");
  const overviewSection = document.querySelector(".z_banner");

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", (event) => {
      event.preventDefault();
      applyTaskFilter(searchInput.value);
      searchInput.focus();
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyTaskFilter(searchInput.value);
      }
    });
  }

  if (heroButton && overviewSection) {
    heroButton.addEventListener("click", () => {
      overviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

if (document.getElementById("dashboard_greeting")) {
  updateGreeting();
}

if (document.getElementById("dashboard_totalTasks")) {
  updateStats();
  setupDashboardInteractions();
}
