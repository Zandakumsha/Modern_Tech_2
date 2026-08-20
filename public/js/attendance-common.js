// ====Sisamila's Attendance functionality==
// Shared helpers + data loading used by both the Attendance page (attendance.js)
// and the Performance Reviews page (reviews.js).

const AVATAR_COLORS = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
];

let EMPLOYEES = [];
let ALL_DATES = [];
let ALL_LEAVE = [];

/* ── Helpers ── */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function initials(name) {
  return name
  .split(" ")
  .map((p) => p[0])
  .slice(0, 2)
  .join("")
  .toUpperCase();
}
function avatarColor(name) {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length];
}
function weekdayShort(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}
function dayNum(dateStr) {
  return new Date(dateStr + "T00:00:00Z").getUTCDate();
}
function monthLabel(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
function formatDateLong(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
function stampClass(status) {
  return "s_stamp_" + String(status).toLowerCase().replace(/\s+/g, "-");
}
function statusIcon(status) {
  const map = {
    present: "ri-checkbox-circle-fill",
    approved: "ri-checkbox-circle-fill",
    completed: "ri-checkbox-circle-fill",
    absent: "ri-close-circle-fill",
    denied: "ri-close-circle-fill",
    pending: "ri-time-line",
    "in-progress": "ri-loader-4-line",
  };
  const key = String(status).toLowerCase().replace(/\s+/g, "-");
  return map[key] || "ri-checkbox-blank-circle-line";
}

function buildNoiseDataUri() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 255 - Math.floor(Math.random() * 60);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.random() * 90;
  }
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL()})`;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("s_toast_visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("s_toast_visible"), 2800);
}

/* ── Load data ── */
async function loadData() {
  const res = await fetch("http://localhost:5000/api/employees", { cache: "no-store" });
  if (!res.ok)
    throw new Error(`Could not load employees from API (HTTP ${res.status})`);
  
  const records = await res.json();
  EMPLOYEES = records;
  ALL_DATES = [
    ...new Set(records.flatMap((e) => (e.attendance || []).map((a) => a.date))),
  ].sort();
  ALL_LEAVE = records
  .flatMap((e) =>
    (e.leaveRequests || []).map((lr) => ({
    ...lr,
    employeeId: e.employeeId,
    name: e.name,
  })),
)
.sort((a, b) => b.date.localeCompare(a.date));
}
/* ── Error ── */
function showLoadError(err) {
  const container =
  document.querySelector("main.s_wrap") || document.getElementById("main");
  if (!container) return;
  container.innerHTML = `<div class="s_empty_state" style="padding-top:60px"><span class="s_stamp s_stamp_absent">Load failed</span><p><strong>Could not read the attendance data.</strong></p><p>${err.message}</p><p>Run <code>npx serve .</code> in your project folder.</p></div>`;
}
