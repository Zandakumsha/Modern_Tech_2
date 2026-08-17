const CALENDAR_API = "/api/calendar";

function calendarUser() {
  const keys = ["currentUser", "user", "loggedInUser"];
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const user = JSON.parse(raw);
        if (user && (user.user_id || user.userId || user.username)) return user;
      } catch {
        if (raw.trim()) return { username: raw.trim() };
      }
    }
    const username = storage.getItem("username");
    if (username) return { username };
  }
  return null;
}

async function calendarRequest(path = "", options = {}) {
  const user = calendarUser() || {};
  const url = new URL(`${CALENDAR_API}${path}`, window.location.origin);
  const userId = user.user_id || user.userId || user.id;
  if (userId) url.searchParams.set("userId", userId);
  else if (user.username) url.searchParams.set("username", user.username);

  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || "Calendar request failed");
  return body;
}

const calendar = document.getElementById("calendar");
const miniCalendar = document.getElementById("miniCalendar");
const monthTitle = document.getElementById("monthTitle");
const headerMonth = document.getElementById("headerMonth");
const eventsList = document.getElementById("eventsList");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedDateInput = document.getElementById("selectedDate");
const eventForm = document.getElementById("eventForm");
const eventTitleInput = document.getElementById("eventTitle");
const eventTimeInput = document.getElementById("eventTime");
const eventCategoryInput = document.getElementById("eventCategory");
const eventDescriptionInput = document.getElementById("eventDescription");

if (calendar && miniCalendar && monthTitle && headerMonth && eventsList && selectedDateTitle && selectedDateInput && eventForm) {
  let current = new Date();
  let selectedDateKey = "";
  let selectedDay = null;
  let events = {};

  function getDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function showFormMessage(message, type = "error") {
    let messageEl = document.getElementById("eventFormMessage");
    if (!messageEl) {
      messageEl = document.createElement("p");
      messageEl.id = "eventFormMessage";
      messageEl.setAttribute("role", "status");
      messageEl.style.marginTop = "10px";
      messageEl.style.fontSize = "0.85rem";
      eventForm.appendChild(messageEl);
    }
    messageEl.textContent = message;
    messageEl.style.color = type === "success" ? "var(--success-color)" : "var(--danger-color)";
  }

  async function loadEvents() {
    const user = calendarUser();
    if (!user || !(user.user_id || user.userId || user.id || user.username)) {
      eventsList.innerHTML = "<p>Please sign in before managing calendar events.</p>";
      return;
    }

    const rows = await calendarRequest();
    events = {};
    rows.forEach((event) => {
      if (!events[event.eventDate]) events[event.eventDate] = [];
      events[event.eventDate].push(event);
    });
    renderCalendar();
    if (selectedDateKey) showEvents(selectedDateKey);
  }

  function renderCalendar() {
    calendar.innerHTML = "";
    miniCalendar.innerHTML = "";
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay();

    monthTitle.textContent = current.toLocaleString("default", { month: "long", year: "numeric" });
    headerMonth.textContent = monthTitle.textContent;

    ["S", "M", "T", "W", "T", "F", "S"].forEach((day) => {
      const div = document.createElement("div");
      div.textContent = day;
      div.style.fontWeight = "600";
      miniCalendar.appendChild(div);
    });

    for (let i = 0; i < startDay; i++) {
      calendar.appendChild(document.createElement("div"));
      miniCalendar.appendChild(document.createElement("div"));
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = getDateKey(year, month + 1, day);
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayDiv.classList.add("today");
      if (selectedDateKey === dateKey) dayDiv.classList.add("selected");
      dayDiv.innerHTML = `<div class="day-number">${day}</div>`;

      if (events[dateKey]?.length) {
        const dot = document.createElement("div");
        dot.className = "dot";
        const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };
        dot.style.background = colors[events[dateKey][0].category] || "#4ea7ff";
        dayDiv.appendChild(dot);
      }
      dayDiv.addEventListener("click", () => selectDate(day));
      calendar.appendChild(dayDiv);

      const miniDay = document.createElement("div");
      miniDay.textContent = day;
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) miniDay.classList.add("today");
      if (selectedDateKey === dateKey) miniDay.classList.add("selected");
      miniDay.addEventListener("click", () => selectDate(day));
      miniCalendar.appendChild(miniDay);
    }
  }

  function selectDate(day) {
    selectedDay = day;
    selectedDateKey = getDateKey(current.getFullYear(), current.getMonth() + 1, day);
    const date = new Date(current.getFullYear(), current.getMonth(), day);
    selectedDateInput.value = date.toISOString().slice(0, 10);
    selectedDateInput.title = date.toDateString();
    selectedDateTitle.textContent = date.toDateString();
    renderCalendar();
    showEvents(selectedDateKey);
    showFormMessage(`Event will be added on ${date.toDateString()}.`, "success");
  }

  function showEvents(key) {
    eventsList.innerHTML = "";
    if (!events[key]?.length) {
      eventsList.innerHTML = "<p>No events scheduled for this day.</p>";
      return;
    }

    events[key].forEach((event) => {
      const div = document.createElement("div");
      div.className = "event";
      const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };
      div.style.borderLeft = `5px solid ${colors[event.category] || "#4ea7ff"}`;
      div.innerHTML = `<h4></h4><p><strong>Time:</strong> ${event.time || ""}</p><p><strong>Category:</strong> ${event.category}</p><p></p><button class="delete-event" type="button">Delete</button>`;
      div.querySelector("h4").textContent = event.title;
      div.querySelector("p:last-of-type").textContent = event.description || "";
      div.querySelector(".delete-event").addEventListener("click", async () => {
        try {
          await calendarRequest(`/${event.id}`, { method: "DELETE", body: JSON.stringify(calendarUser() || {}) });
          await loadEvents();
        } catch (error) {
          alert(error.message);
        }
      });
      eventsList.appendChild(div);
    });
  }

  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = calendarUser();
    if (!user || !(user.user_id || user.userId || user.id || user.username)) {
      showFormMessage("Please sign in before adding an event.");
      return;
    }

    if (!selectedDateKey) {
      const today = new Date();
      selectDate(today.getDate());
      return;
    }

    const title = eventTitleInput?.value.trim() || "";
    const time = eventTimeInput?.value || "";
    const category = eventCategoryInput?.value || "Work";
    const description = eventDescriptionInput?.value.trim() || "";

    if (!title) {
      showFormMessage("Please enter an event title.");
      eventTitleInput?.focus();
      return;
    }
    if (!time) {
      showFormMessage("Please choose an event time.");
      eventTimeInput?.focus();
      return;
    }

    const submitButton = eventForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Adding...";
    }

    try {
      await calendarRequest("", {
        method: "POST",
        body: JSON.stringify({
          userId: user.user_id || user.userId || user.id,
          username: user.username,
          eventDate: selectedDateKey,
          title,
          time,
          category,
          description,
        }),
      });

      eventForm.reset();
      await loadEvents();
      selectDate(selectedDay);
      showFormMessage("Event added successfully.", "success");
    } catch (error) {
      console.error("Add event error:", error);
      showFormMessage(error.message || "Unable to add event.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Add Event";
      }
    }
  });

  document.getElementById("prevMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1);
    const maxDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    renderCalendar();
    selectDate(Math.min(selectedDay || 1, maxDay));
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1);
    const maxDay = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    renderCalendar();
    selectDate(Math.min(selectedDay || 1, maxDay));
  });

  const today = new Date();
  selectDate(today.getDate());
  loadEvents().catch((error) => {
    console.error(error);
    eventsList.innerHTML = `<p>${error.message || "Unable to load events."}</p>`;
  });
}
