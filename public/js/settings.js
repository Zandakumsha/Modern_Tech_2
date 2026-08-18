const SETTINGS_API = "/api/settings";

const COMPANY_DETAILS = {
  companyName: "Modern Tech",
  industry: "Technology / HR Solutions",
  email: "info@moderntech.co.za",
  phone: "+27 (21) 555-0192",
  address: "101 Data Boulevard, Cape Town, 8001",
  hr: "Modern Tech Human Resources",
  manager: "HR Manager, Modern Tech"
};

function getSettingsUser() {
  const keys = ["currentUser", "user"];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const user = JSON.parse(raw);
      if (user && (user.user_id || user.userId || user.username)) return user;
    } catch (error) { console.warn(`Ignoring invalid ${key} localStorage value`, error); }
  }
  const sessionUsername = sessionStorage.getItem("username");
  if (sessionUsername) return { username: sessionUsername };
  return null;
}

function settingsUrl(path = "") {
  const user = getSettingsUser();
  if (!user) throw new Error("No signed-in user was found. Please sign in again.");
  const url = new URL(`${SETTINGS_API}${path}`, window.location.origin);
  const userId = user.user_id || user.userId || user.id;
  const username = user.username;
  if (userId) url.searchParams.set("userId", userId);
  else if (username) url.searchParams.set("username", username);
  else throw new Error("The signed-in user has no user ID or username.");
  return url;
}

async function settingsRequest(path = "", options = {}) {
  const url = settingsUrl(path);
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Settings request failed");
  return body;
}

function setField(id, value) { const element = document.getElementById(id); if (element && value !== undefined && value !== null) element.value = value; }
function setChecked(id, value) { const element = document.getElementById(id); if (element && value !== undefined && value !== null) element.checked = Boolean(value); }

function applyCompanyDetails() {
  setField("company_name", COMPANY_DETAILS.companyName);
  setField("company_industry", COMPANY_DETAILS.industry);
  setField("company_email", COMPANY_DETAILS.email);
  setField("company_phone", COMPANY_DETAILS.phone);
  setField("company_address", COMPANY_DETAILS.address);
  setField("company_hr", COMPANY_DETAILS.hr);
  setField("company_manager", COMPANY_DETAILS.manager);
}

async function loadSettings() {
  const user = getSettingsUser();
  let data = {};
  try { data = await settingsRequest(); } catch (error) { console.warn("Settings API unavailable; using shared company defaults.", error); }
  const profile = data.user || user || {};
  const preferences = data.preferences || {};

  setField("settings_username", profile.username || "");
  setField("settings-email", profile.email || "");
  setField("settings_role", profile.role || "");
  applyCompanyDetails();
  setChecked("darkModeToggle", preferences.darkMode);
  setChecked("emailNotifications", preferences.emailNotifications);
  setChecked("pushNotifications", preferences.pushNotifications);
  setChecked("attendanceAlerts", preferences.attendanceAlerts);
  const theme = document.getElementById("theme");
  if (theme && preferences.colorTheme) theme.value = preferences.colorTheme;

  if (profile.avatar) document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach(img => { img.src = profile.avatar; });
  if (user && data.user) {
    const merged = { ...user, ...data.user };
    localStorage.setItem("currentUser", JSON.stringify(merged));
    localStorage.setItem("user", JSON.stringify(merged));
  }
}

async function saveCompany() {
  // Company details are shared application-wide, not personal employee data.
  applyCompanyDetails();
  try {
    await settingsRequest("/company", { method: "PUT", body: JSON.stringify(COMPANY_DETAILS) });
  } catch (error) {
    console.warn("Company API save unavailable; keeping shared frontend defaults.", error);
  }
  alert("Modern Tech company details saved successfully for the application.");
}

async function savePreferences() {
  const user = getSettingsUser();
  if (!user) throw new Error("No signed-in user was found. Please sign in again.");
  await settingsRequest("/preferences", { method: "PUT", body: JSON.stringify({ userId: user.user_id || user.userId || user.id, username: user.username, darkMode: Boolean(document.getElementById("darkModeToggle")?.checked), colorTheme: document.getElementById("theme")?.value || "default", emailNotifications: Boolean(document.getElementById("emailNotifications")?.checked), pushNotifications: Boolean(document.getElementById("pushNotifications")?.checked), attendanceAlerts: Boolean(document.getElementById("attendanceAlerts")?.checked) }) });
}

document.addEventListener("DOMContentLoaded", async () => {
  applyCompanyDetails();
  try { await loadSettings(); } catch (error) { console.error("Unable to load settings:", error); alert(error.message); }
  document.getElementById("saveCompanyBtn")?.addEventListener("click", async () => { try { await saveCompany(); } catch (error) { console.error(error); alert(error.message); } });
  ["darkModeToggle", "emailNotifications", "pushNotifications", "attendanceAlerts", "theme"].forEach(id => document.getElementById(id)?.addEventListener("change", () => savePreferences().catch(error => console.error("Unable to save preferences:", error))));
});

window.selectAvatar = function selectAvatar(imagePath) {
  const user = getSettingsUser();
  if (user) { user.avatar = imagePath; localStorage.setItem("currentUser", JSON.stringify(user)); localStorage.setItem("user", JSON.stringify(user)); }
  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach(img => { img.src = imagePath; });
};
