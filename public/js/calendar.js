// =========================
// Calendar Functionality
// =========================

const calendar = document.getElementById("calendar");
const miniCalendar = document.getElementById("miniCalendar");
const monthTitle = document.getElementById("monthTitle");
const headerMonth = document.getElementById("headerMonth");
const eventsList = document.getElementById("eventsList");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedDateInput = document.getElementById("selectedDate");
const eventForm = document.getElementById("eventForm");

if (
  calendar &&
  miniCalendar &&
  monthTitle &&
  headerMonth &&
  eventsList &&
  selectedDateTitle &&
  selectedDateInput &&
  eventForm
) {
  let current = new Date();
  let selectedDateKey = "";
  let selectedDay = null;

  let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};

  function saveEvents() {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }

  function getDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getEventColor(category) {
    switch (category) {
      case "Work":
        return "#9b4dff";
      case "Personal":
        return "#2ecc71";
      case "Urgent":
        return "#ff4d6d";
      default:
        return "#4ea7ff";
    }
  }

  // Adds the events directly underneath the date number inside each calendar cell.
  function renderDayEvents(dayDiv, dateKey) {
    const dayEvents = events[dateKey] || [];

    if (dayEvents.length === 0) return;

    const eventContainer = document.createElement("div");
    eventContainer.className = "calendar-day-events";

    dayEvents.forEach((event) => {
      const eventItem = document.createElement("div");
      eventItem.className = "calendar-day-event";
      eventItem.style.borderLeft = `3px solid ${getEventColor(event.category)}`;
      eventItem.title = `${event.title}${event.time ? ` - ${event.time}` : ""}`;

      const title = document.createElement("span");
      title.className = "calendar-day-event-title";
      title.textContent = event.title;

      eventItem.appendChild(title);

      if (event.time) {
        const time = document.createElement("span");
        time.className = "calendar-day-event-time";
        time.textContent = event.time;
        eventItem.appendChild(time);
      }

      eventContainer.appendChild(eventItem);
    });

    dayDiv.appendChild(eventContainer);
  }

  function renderCalendar() {
    calendar.innerHTML = "";
    miniCalendar.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    monthTitle.textContent = current.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    headerMonth.textContent = current.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

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

      // ========= MAIN CALENDAR =========
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";

      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        dayDiv.classList.add("today");
      }

      if (selectedDateKey === dateKey) {
        dayDiv.classList.add("selected");
      }

      const dayNumber = document.createElement("div");
      dayNumber.className = "day-number";
      dayNumber.textContent = day;
      dayDiv.appendChild(dayNumber);

      // Keep the event indicator for quick visual identification.
      if (events[dateKey] && events[dateKey].length > 0) {
        const dot = document.createElement("div");
        dot.className = "dot";
        dot.style.background = getEventColor(events[dateKey][0].category);
        dayDiv.appendChild(dot);

        // Show the actual event(s) underneath the date number.
        renderDayEvents(dayDiv, dateKey);
      }

      dayDiv.addEventListener("click", () => selectDate(day));
      calendar.appendChild(dayDiv);

      // ========= MINI CALENDAR =========
      const miniDay = document.createElement("div");
      miniDay.textContent = day;

      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        miniDay.classList.add("today");
      }

      if (selectedDateKey === dateKey) {
        miniDay.classList.add("selected");
      }

      miniDay.addEventListener("click", () => selectDate(day));
      miniCalendar.appendChild(miniDay);
    }
  }

  function selectDate(day) {
    selectedDay = day;

    const year = current.getFullYear();
    const month = current.getMonth() + 1;

    selectedDateKey = getDateKey(year, month, day);

    const date = new Date(year, month - 1, day);

    selectedDateInput.value = date.toDateString();
    selectedDateTitle.textContent = date.toDateString();

    renderCalendar();
    showEvents(selectedDateKey);
  }

  function showEvents(key) {
    eventsList.innerHTML = "";

    if (!events[key] || events[key].length === 0) {
      eventsList.innerHTML = "<p>No events scheduled for this day.</p>";
      return;
    }

    events[key].forEach((event, index) => {
      const div = document.createElement("div");
      div.className = "event";
      div.style.borderLeft = `5px solid ${getEventColor(event.category)}`;

      const title = document.createElement("h4");
      title.textContent = event.title;

      const time = document.createElement("p");
      time.innerHTML = "<strong>Time:</strong> ";
      time.appendChild(document.createTextNode(event.time || "Not specified"));

      const category = document.createElement("p");
      category.innerHTML = "<strong>Category:</strong> ";
      category.appendChild(document.createTextNode(event.category || "General"));

      const description = document.createElement("p");
      description.textContent = event.description || "";

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-event";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", () => {
        events[key].splice(index, 1);

        if (events[key].length === 0) {
          delete events[key];
        }

        saveEvents();
        renderCalendar();
        showEvents(key);
      });

      div.append(title, time, category, description, deleteButton);
      eventsList.appendChild(div);
    });
  }

  // ===================
  // Add Event
  // ===================
  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!selectedDateKey) {
      alert("Please select a date first.");
      return;
    }

    const title = document.getElementById("eventTitle").value.trim();
    const time = document.getElementById("eventTime").value;
    const category = document.getElementById("eventCategory").value;
    const description = document
      .getElementById("eventDescription")
      .value.trim();

    if (!title) {
      alert("Please enter an event title.");
      return;
    }

    if (!events[selectedDateKey]) {
      events[selectedDateKey] = [];
    }

    events[selectedDateKey].push({
      title,
      time,
      category,
      description,
    });

    saveEvents();

    // Re-render immediately so the new event appears under its date.
    renderCalendar();
    showEvents(selectedDateKey);

    eventForm.reset();

    selectedDateInput.value = new Date(
      current.getFullYear(),
      current.getMonth(),
      selectedDay,
    ).toDateString();
  });

  // ===================
  // Previous Month
  // ===================
  document.getElementById("prevMonth").addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();

    if (selectedDay) {
      selectDate(
        Math.min(
          selectedDay,
          new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate(),
        ),
      );
    }
  });

  // ===================
  // Next Month
  // ===================
  document.getElementById("nextMonth").addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();

    if (selectedDay) {
      selectDate(
        Math.min(
          selectedDay,
          new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate(),
        ),
      );
    }
  });

  // ===================
  // Initial Load
  // ===================
  renderCalendar();

  const today = new Date();

  if (
    today.getMonth() === current.getMonth() &&
    today.getFullYear() === current.getFullYear()
  ) {
    selectDate(today.getDate());
  }
}
