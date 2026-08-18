const SETTINGS_API = "/api/settings";
const COMPANY_DETAILS = {
  companyName: "Modern Tech",
  industry: "Technology / HR Solutions",
  email: "info@moderntech.co.za",
  phone: "+27 (21) 555-0192",
  address: "101 Data Boulevard, Cape Town, 8001",
  hr: "Modern Tech Human Resources",
  manager: "HR Manager, Modern Tech",
};

function getSettingsUser() {
  for (const key of ["currentUser", "user"]) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user) return user;
      } catch { /* ignore invalid old session */ }
    }
  }
  return { username: sessionStorage.getItem("username") || "", role: sessionStorage.getItem("role") || "" };
}

function isHrEnvironmentUser(user = getSettingsUser()) {
  return user.userId === "hr-env" || user.user_id === "hr-env" || user.username === "hrmanager" || user.role === "Manager" && !user.userId && !user.user_id;
}

function settingsUrl(path = "") {
  const user = getSettingsUser();
  const url = new URL(`${SETTINGS_API}${path}`, location.origin);
  const id = user.userId || user.user_id || user.id;
  if (id) url.searchParams.set("userId", id);
  else if (user.username) url.searchParams.set("username", user.username);
  return url;
}

async function settingsRequest(path = "", options = {}) {
  const response = await fetch(settingsUrl(path), {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Settings request failed");
  return data;
}

const setField = (id, value) => { const el = document.getElementById(id); if (el) el.value = value ?? ""; };
const setChecked = (id, value) => { const el = document.getElementById(id); if (el) el.checked = Boolean(value); };

function applyCompanyDetails() {
  setField("company_name", COMPANY_DETAILS.companyName);
  setField("company_industry", COMPANY_DETAILS.industry);
  setField("company_email", COMPANY_DETAILS.email);
  setField("company_phone", COMPANY_DETAILS.phone);
  setField("company_address", COMPANY_DETAILS.address);
  setField("company_hr", COMPANY_DETAILS.hr);
  setField("company_manager", COMPANY_DETAILS.manager);
}

function loadLocalPreferences() {
  return {
    darkMode: localStorage.getItem("settings-dark-mode") === "true",
    colorTheme: localStorage.getItem("color-theme") || "default",
    emailNotifications: localStorage.getItem("emailNotifications") !== "false",
    pushNotifications: localStorage.getItem("pushNotifications") !== "false",
    attendanceAlerts: localStorage.getItem("attendanceAlerts") !== "false",
  };
}

function applyPreferences(preferences) {
  const p = { ...loadLocalPreferences(), ...(preferences || {}) };
  setChecked("darkModeToggle", p.darkMode);
  setChecked("emailNotifications", p.emailNotifications);
  setChecked("pushNotifications", p.pushNotifications);
  setChecked("attendanceAlerts", p.attendanceAlerts);
  const theme = document.getElementById("theme");
  if (theme) theme.value = p.colorTheme || "default";
}

async function loadSettings() {
  const user = getSettingsUser();
  let data = {};
  if (!isHrEnvironmentUser(user)) {
    try { data = await settingsRequest(); } catch (error) { console.warn("Settings API unavailable:", error.message); }
  }

  const profile = data.user || user || {};
  setField("settings_username", profile.username || "hrmanager");
  setField("settings-email", profile.email || "hr@moderntech.com");
  setField("settings_role", profile.role || "Manager");
  applyCompanyDetails();
  applyPreferences(data.preferences);
  if (profile.avatar) document.querySelectorAll("#navbarProfileImage,#settingsProfileImage").forEach(img => { img.src = profile.avatar; });
}

async function saveCompany() {
  applyCompanyDetails();
  await settingsRequest("/company", { method: "PUT", body: JSON.stringify(COMPANY_DETAILS) });
  alert("Modern Tech company details saved successfully.");
}

async function savePreferences() {
  const darkMode = !!document.getElementById("darkModeToggle")?.checked;
  const emailNotifications = !!document.getElementById("emailNotifications")?.checked;
  const pushNotifications = !!document.getElementById("pushNotifications")?.checked;
  const attendanceAlerts = !!document.getElementById("attendanceAlerts")?.checked;
  const colorTheme = document.getElementById("theme")?.value || "default";

  localStorage.setItem("settings-dark-mode", String(darkMode));
  localStorage.setItem("emailNotifications", String(emailNotifications));
  localStorage.setItem("pushNotifications", String(pushNotifications));
  localStorage.setItem("attendanceAlerts", String(attendanceAlerts));
  localStorage.setItem("color-theme", colorTheme);

  const user = getSettingsUser();
  if (isHrEnvironmentUser(user)) return;

  await settingsRequest("/preferences", {
    method: "PUT",
    body: JSON.stringify({ userId: user.userId || user.user_id || user.id, username: user.username, darkMode, colorTheme, emailNotifications, pushNotifications, attendanceAlerts }),
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  applyCompanyDetails();
  try { await loadSettings(); } catch (error) { console.error(error); }

  document.getElementById("saveCompanyBtn")?.addEventListener("click", () => saveCompany().catch(error => alert(error.message)));
  ["darkModeToggle", "emailNotifications", "pushNotifications", "attendanceAlerts", "theme"].forEach(id => document.getElementById(id)?.addEventListener("change", () => savePreferences().catch(error => console.error(error))));

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    ["authToken", "currentUser", "user", "employeeId"].forEach(k => localStorage.removeItem(k));
    ["authenticated", "username", "role"].forEach(k => sessionStorage.removeItem(k));
    location.replace("login.html");
  });
});

window.selectAvatar = function selectAvatar(src) {
  const user = getSettingsUser();
  user.avatar = src;
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("user", JSON.stringify(user));
  document.querySelectorAll("#navbarProfileImage,#settingsProfileImage").forEach(img => { img.src = src; });
};
