const API_URL = "/api/calendar";

const calendar = document.getElementById("calendar");
const miniCalendar = document.getElementById("miniCalendar");
const monthTitle = document.getElementById("monthTitle");
const headerMonth = document.getElementById("headerMonth");
const eventsList = document.getElementById("eventsList");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const eventForm = document.getElementById("eventForm");
const eventTitleInput = document.getElementById("eventTitle");
const eventTimeInput = document.getElementById("eventTime");
const eventCategoryInput = document.getElementById("eventCategory");
const eventDescriptionInput = document.getElementById("eventDescription");

if (calendar && miniCalendar && monthTitle && headerMonth && eventsList && selectedDateTitle && eventForm) {
  let current = new Date();
  let selectedDateKey = "";
  let selectedDay = null;
  let events = {};
  let loading = false;

  const key = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  function getLoggedInUsername() {
    const candidates = [
      localStorage.getItem("username"),
      localStorage.getItem("hr_username"),
      localStorage.getItem("user"),
      localStorage.getItem("currentUser"),
      sessionStorage.getItem("username"),
      sessionStorage.getItem("hr_username"),
      sessionStorage.getItem("user"),
      sessionStorage.getItem("currentUser")
    ];

    for (const value of candidates) {
      if (!value) continue;
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
          if (parsed.username) return String(parsed.username).trim();
          if (parsed.user?.username) return String(parsed.user.username).trim();
        }
      } catch {
        if (String(value).trim()) return String(value).trim();
      }
    }

    return "";
  }

  function showFormMessage(message, type = "error") {
    let el = document.getElementById("eventFormMessage");
    if (!el) {
      el = document.createElement("p");
      el.id = "eventFormMessage";
      el.setAttribute("role", "status");
      eventForm.appendChild(el);
    }
    el.textContent = message;
    el.style.color = type === "success" ? "green" : "red";
  }

  async function parseResponse(response) {
    const text = await response.text();
    let data = null;

    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid JSON (${response.status}).`);
      }
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Calendar request failed (${response.status}).`);
    }

    return data;
  }

  function normaliseEvent(event) {
    return {
      id: event.id ?? event.event_id,
      eventDate: String(event.eventDate ?? event.event_date ?? "").slice(0, 10),
      title: event.title ?? event.event_title ?? "Untitled event",
      time: event.time ?? event.event_time ?? "",
      category: event.category ?? "General",
      description: event.description ?? "",
      hr_username: event.hr_username ?? ""
    };
  }

  function groupEvents(apiEvents) {
    const grouped = {};
    for (const rawEvent of apiEvents) {
      const event = normaliseEvent(rawEvent);
      if (!event.eventDate) continue;
      (grouped[event.eventDate] ||= []).push(event);
    }
    return grouped;
  }

  async function loadEvents() {
    if (loading) return;
    loading = true;

    try {
      // Calendar deliberately does NOT use a JWT/token.
      const response = await fetch(API_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });

      const data = await parseResponse(response);
      const apiEvents = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : Array.isArray(data?.data)
            ? data.data
            : [];

      events = groupEvents(apiEvents);
      renderCalendar();
      showEvents(selectedDateKey);
    } catch (error) {
      console.error("Failed to load calendar events:", error);
      events = {};
      renderCalendar();
      eventsList.innerHTML = `<p>Unable to load calendar events. ${escapeHtml(error.message)}</p>`;
    } finally {
      loading = false;
    }
  }

  async function createEvent(eventData) {
    const hrUsername = getLoggedInUsername();
    if (!hrUsername) {
      throw new Error("The logged-in HR username could not be found. Please log in again.");
    }

    // No Authorization header and no token is used for calendar requests.
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        event_date: eventData.eventDate,
        title: eventData.title,
        event_time: eventData.time,
        category: eventData.category || "General",
        description: eventData.description || "",
        hr_username: hrUsername
      })
    });

    const data = await parseResponse(response);
    return data?.event ?? data?.data ?? data;
  }

  async function deleteEvent(eventId) {
    if (eventId === undefined || eventId === null || eventId === "") {
      throw new Error("This event does not have a valid database ID.");
    }

    // No Authorization header and no token is used here either.
    const response = await fetch(`${API_URL}/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "same-origin"
    });

    return parseResponse(response);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderDayEvents(dayDiv, dateKey) {
    const dayEvents = events[dateKey] || [];
    if (!dayEvents.length) return;

    const wrap = document.createElement("div");
    wrap.className = "calendar-day-events";

    dayEvents.forEach(event => {
      const item = document.createElement("div");
      item.className = "calendar-day-event";
      item.title = `${event.title}${event.time ? ` - ${event.time}` : ""}`;
      item.textContent = event.time ? `${event.time} ${event.title}` : event.title;
      wrap.appendChild(item);
    });

    dayDiv.appendChild(wrap);
  }

  function renderCalendar() {
    calendar.innerHTML = "";
    miniCalendar.innerHTML = "";

    const year = current.getFullYear();
    const month = current.getMonth();
    const first = new Date(year, month, 1);
    const total = new Date(year, month + 1, 0).getDate();
    const start = first.getDay();

    monthTitle.textContent = current.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
    headerMonth.textContent = monthTitle.textContent;

    ["S", "M", "T", "W", "T", "F", "S"].forEach(dayName => {
      const div = document.createElement("div");
      div.textContent = dayName;
      miniCalendar.appendChild(div);
    });

    for (let i = 0; i < start; i++) {
      calendar.appendChild(document.createElement("div"));
      miniCalendar.appendChild(document.createElement("div"));
    }

    const today = new Date();

    for (let day = 1; day <= total; day++) {
      const dateKey = key(year, month + 1, day);
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";

      if (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        dayDiv.classList.add("today");
      }

      if (selectedDateKey === dateKey) dayDiv.classList.add("selected");

      const number = document.createElement("div");
      number.className = "day-number";
      number.textContent = day;
      dayDiv.appendChild(number);

      if (events[dateKey]?.length) {
        const dot = document.createElement("div");
        dot.className = "dot";
        dayDiv.appendChild(dot);
        renderDayEvents(dayDiv, dateKey);
      }

      dayDiv.addEventListener("click", () => selectDate(day));
      calendar.appendChild(dayDiv);

      const mini = document.createElement("div");
      mini.textContent = day;
      if (selectedDateKey === dateKey) mini.classList.add("selected");
      mini.addEventListener("click", () => selectDate(day));
      miniCalendar.appendChild(mini);
    }
  }

  function selectDate(day) {
    selectedDay = day;
    selectedDateKey = key(current.getFullYear(), current.getMonth() + 1, day);

    const date = new Date(current.getFullYear(), current.getMonth(), day);
    selectedDateTitle.textContent = date.toDateString();

    renderCalendar();
    showEvents(selectedDateKey);
  }

  function showEvents(dateKey) {
    eventsList.innerHTML = "";
    const dayEvents = events[dateKey] || [];

    if (!dayEvents.length) {
      eventsList.innerHTML = "<p>No events scheduled for this day.</p>";
      return;
    }

    dayEvents.forEach(event => {
      const div = document.createElement("div");
      div.className = "event";

      const title = document.createElement("h4");
      title.textContent = event.title;

      const time = document.createElement("p");
      time.innerHTML = "<strong>Time:</strong> ";
      time.append(document.createTextNode(event.time || "Not specified"));

      const category = document.createElement("p");
      category.innerHTML = "<strong>Category:</strong> ";
      category.append(document.createTextNode(event.category || "General"));

      const description = document.createElement("p");
      description.textContent = event.description || "";

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete";

      del.addEventListener("click", async () => {
        if (!confirm(`Delete "${event.title}"?`)) return;

        del.disabled = true;
        del.textContent = "Deleting...";

        try {
          await deleteEvent(event.id);
          showFormMessage("Event deleted successfully.", "success");
          await loadEvents();
        } catch (error) {
          console.error("Failed to delete calendar event:", error);
          showFormMessage(error.message);
          del.disabled = false;
          del.textContent = "Delete";
        }
      });

      div.append(title, time, category, description, del);
      eventsList.appendChild(div);
    });
  }

  eventForm.addEventListener("submit", async e => {
    e.preventDefault();

    if (!eventForm.reportValidity()) return;

    if (!selectedDateKey) {
      showFormMessage("Please select a date on the calendar first.");
      return;
    }

    const title = eventTitleInput.value.trim();
    const time = eventTimeInput.value;
    const category = eventCategoryInput.value;
    const description = eventDescriptionInput.value.trim();

    if (!title || !time) {
      showFormMessage("Please enter an event title and time.");
      return;
    }

    const submitButton = eventForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.dataset.originalText = submitButton.textContent;
      submitButton.textContent = "Saving...";
    }

    try {
      await createEvent({
        eventDate: selectedDateKey,
        title,
        time,
        category,
        description
      });

      eventForm.reset();
      showFormMessage("Event added successfully.", "success");
      await loadEvents();
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      showFormMessage(error.message);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitButton.dataset.originalText || "Add Event";
      }
    }
  });

  document.getElementById("prevMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1);
    const max = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    renderCalendar();
    selectDate(Math.min(selectedDay || 1, max));
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1);
    const max = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    renderCalendar();
    selectDate(Math.min(selectedDay || 1, max));
  });

  const today = new Date();
  selectDate(today.getDate());
  loadEvents();
}
