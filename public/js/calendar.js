// All frontend pages are served by Express on port 5000, so the calendar
// API uses the same origin. This prevents Live Server/port mismatch errors.
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

  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let body = null;

  if (text.trim()) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {
        error: text.replace(/<[^>]*>/g, " ").trim() || "Server returned an invalid response.",
      };
    }
  }

  if (!response.ok) {
    throw new Error(body?.error || `Calendar request failed (${response.status})`);
  }

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
    messageEl.style.color = type === "success" ? "green" : "red";
  }

  async function loadEvents() {
    const user = calendarUser();
    if (!user || !(user.user_id || user.userId || user.id || user.username)) {
      eventsList.innerHTML = "<p>Please sign in before managing calendar events.</p>";
      return;
    }

    const rows = await calendarRequest();
    events = {};
    (Array.isArray(rows) ? rows : []).forEach((event) => {
      if (!events[event.eventDate]) events[event.eventDate] = [];
      events[event.eventDate].push(event);
    });
    renderCalendar();
    if (selectedDateKey) showEvents(selectedDateKey);
  }

  function renderDayEvents(dayDiv, dateKey) {
    const dayEvents = events[dateKey] || [];
    if (!dayEvents.length) return;

    const eventContainer = document.createElement("div");
    eventContainer.className = "calendar-day-events";
    const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };

    dayEvents.forEach((event) => {
      const item = document.createElement("div");
      item.className = "calendar-day-event";
      item.style.borderLeft = `3px solid ${colors[event.category] || "#4ea7ff"}`;
      item.title = `${event.title}${event.time ? ` - ${event.time}` : ""}`;

      const title = document.createElement("span");
      title.className = "calendar-day-event-title";
      title.textContent = event.title;
      item.appendChild(title);

      if (event.time) {
        const time = document.createElement("span");
        time.className = "calendar-day-event-time";
        time.textContent = event.time;
        item.appendChild(time);
      }
      eventContainer.appendChild(item);
    });
    dayDiv.appendChild(eventContainer);
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

      const dayNumber = document.createElement("div");
      dayNumber.className = "day-number";
      dayNumber.textContent = day;
      dayDiv.appendChild(dayNumber);

      if (events[dateKey]?.length) {
        const dot = document.createElement("div");
        dot.className = "dot";
        const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };
        dot.style.background = colors[events[dateKey][0].category] || "#4ea7ff";
        dayDiv.appendChild(dot);
        renderDayEvents(dayDiv, dateKey);
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
    selectedDateInput.value = selectedDateKey;
    selectedDateInput.title = date.toDateString();
    selectedDateTitle.textContent = date.toDateString();
    renderCalendar();
    showEvents(selectedDateKey);
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

      const heading = document.createElement("h4");
      heading.textContent = event.title;
      div.appendChild(heading);

      const time = document.createElement("p");
      time.innerHTML = "<strong>Time:</strong> ";
      time.appendChild(document.createTextNode(event.time || "Not specified"));
      div.appendChild(time);

      const category = document.createElement("p");
      category.innerHTML = "<strong>Category:</strong> ";
      category.appendChild(document.createTextNode(event.category || "General"));
      div.appendChild(category);

      const description = document.createElement("p");
      description.textContent = event.description || "";
      div.appendChild(description);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-event";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        try {
          await calendarRequest(`/${event.id}`, { method: "DELETE", body: JSON.stringify(calendarUser() || {}) });
          await loadEvents();
        } catch (error) {
          alert(error.message);
        }
      });
      div.appendChild(deleteButton);
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
      showFormMessage("Please select a date first.");
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
      const created = await calendarRequest("", {
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

      if (created?.eventDate) {
        if (!events[created.eventDate]) events[created.eventDate] = [];
        events[created.eventDate].push(created);
      }

      eventForm.reset();
      renderCalendar();
      showEvents(selectedDateKey);
      showFormMessage("Event added successfully.", "success");

      try {
        await loadEvents();
      } catch (refreshError) {
        console.warn("Calendar refresh failed after adding event:", refreshError);
      }
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
