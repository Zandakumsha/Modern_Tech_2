const CALENDAR_API = "/api/calendar";

function calendarUser() {
  try { return JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "null"); }
  catch { return null; }
}

async function calendarRequest(path = "", options = {}) {
  const user = calendarUser() || {};
  const url = new URL(`${CALENDAR_API}${path}`, window.location.origin);
  if (user.user_id || user.userId) url.searchParams.set("userId", user.user_id || user.userId);
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

if (calendar && miniCalendar && monthTitle && headerMonth && eventsList && selectedDateTitle && selectedDateInput && eventForm) {
  let current = new Date();
  let selectedDateKey = "";
  let selectedDay = null;
  let events = {};

  async function loadEvents() {
    const rows = await calendarRequest();
    events = {};
    rows.forEach((event) => {
      if (!events[event.eventDate]) events[event.eventDate] = [];
      events[event.eventDate].push(event);
    });
    renderCalendar();
    if (selectedDateKey) showEvents(selectedDateKey);
  }

  function getDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
      const div = document.createElement("div"); div.textContent = day; div.style.fontWeight = "600"; miniCalendar.appendChild(div);
    });
    for (let i = 0; i < startDay; i++) { calendar.appendChild(document.createElement("div")); miniCalendar.appendChild(document.createElement("div")); }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
      const dateKey = getDateKey(year, month + 1, day);
      const dayDiv = document.createElement("div"); dayDiv.className = "day";
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayDiv.classList.add("today");
      if (selectedDateKey === dateKey) dayDiv.classList.add("selected");
      dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
      if (events[dateKey]?.length) {
        const dot = document.createElement("div"); dot.className = "dot";
        const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };
        dot.style.background = colors[events[dateKey][0].category] || "#4ea7ff";
        dayDiv.appendChild(dot);
      }
      dayDiv.addEventListener("click", () => selectDate(day));
      calendar.appendChild(dayDiv);

      const miniDay = document.createElement("div"); miniDay.textContent = day;
      if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) miniDay.classList.add("today");
      if (selectedDateKey === dateKey) miniDay.classList.add("selected");
      miniDay.addEventListener("click", () => selectDate(day)); miniCalendar.appendChild(miniDay);
    }
  }

  function selectDate(day) {
    selectedDay = day;
    selectedDateKey = getDateKey(current.getFullYear(), current.getMonth() + 1, day);
    const date = new Date(current.getFullYear(), current.getMonth(), day);
    selectedDateInput.value = date.toDateString();
    selectedDateTitle.textContent = date.toDateString();
    renderCalendar();
    showEvents(selectedDateKey);
  }

  function showEvents(key) {
    eventsList.innerHTML = "";
    if (!events[key]?.length) { eventsList.innerHTML = "<p>No events scheduled for this day.</p>"; return; }
    events[key].forEach((event) => {
      const div = document.createElement("div"); div.className = "event";
      const colors = { Work: "#9b4dff", Personal: "#2ecc71", Urgent: "#ff4d6d" };
      div.style.borderLeft = `5px solid ${colors[event.category] || "#4ea7ff"}`;
      div.innerHTML = `<h4></h4><p><strong>Time:</strong> ${event.time || ""}</p><p><strong>Category:</strong> ${event.category}</p><p></p><button class="delete-event">Delete</button>`;
      div.querySelector("h4").textContent = event.title;
      div.querySelector("p:last-of-type").textContent = event.description || "";
      div.querySelector(".delete-event").addEventListener("click", async () => {
        try { await calendarRequest(`/${event.id}`, { method: "DELETE", body: JSON.stringify(calendarUser() || {}) }); await loadEvents(); }
        catch (error) { alert(error.message); }
      });
      eventsList.appendChild(div);
    });
  }

  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedDateKey) return alert("Please select a date first.");
    try {
      await calendarRequest("", {
        method: "POST",
        body: JSON.stringify({
          ...(calendarUser() || {}),
          eventDate: selectedDateKey,
          title: document.getElementById("eventTitle").value.trim(),
          time: document.getElementById("eventTime").value,
          category: document.getElementById("eventCategory").value,
          description: document.getElementById("eventDescription").value.trim(),
        }),
      });
      eventForm.reset();
      await loadEvents();
      selectDate(selectedDay);
    } catch (error) { alert(error.message); }
  });

  document.getElementById("prevMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1); renderCalendar();
    if (selectedDay) selectDate(Math.min(selectedDay, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()));
  });

  document.getElementById("nextMonth")?.addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1); renderCalendar();
    if (selectedDay) selectDate(Math.min(selectedDay, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()));
  });

  renderCalendar();
  loadEvents().catch((error) => { console.error(error); eventsList.innerHTML = "<p>Unable to load events.</p>"; });
  const today = new Date();
  if (today.getMonth() === current.getMonth() && today.getFullYear() === current.getFullYear()) selectDate(today.getDate());
}
