const SETTINGS_API = "/api/settings";

function getSettingsUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "null");
  } catch { return null; }
}

async function settingsRequest(path = "", options = {}) {
  const user = getSettingsUser() || {};
  const url = new URL(`${SETTINGS_API}${path}`, window.location.origin);
  if (user.user_id || user.userId) url.searchParams.set("userId", user.user_id || user.userId);
  else if (user.username) url.searchParams.set("username", user.username);
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || "Settings request failed");
  return body;
}

function setField(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null) element.value = value;
}

async function loadSettings() {
  const data = await settingsRequest();
  const user = data.user || getSettingsUser() || {};
  const company = data.company || {};
  const preferences = data.preferences || {};

  setField("settings_username", user.username || "");
  setField("settings-email", user.email || "");
  setField("settings_role", user.role || "");
  setField("company_name", company.companyName || "");
  setField("company_industry", company.industry || "");
  setField("company_email", company.email || "");
  setField("company_phone", company.phone || "");

  const values = {
    darkModeToggle: preferences.darkMode,
    emailNotifications: preferences.emailNotifications,
    pushNotifications: preferences.pushNotifications,
    attendanceAlerts: preferences.attendanceAlerts,
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value !== undefined) element.checked = !!value;
  });

  const theme = document.getElementById("theme");
  if (theme && preferences.colorTheme) theme.value = preferences.colorTheme;
}

async function saveCompany() {
  await settingsRequest("/company", {
    method: "PUT",
    body: JSON.stringify({
      companyName: document.getElementById("company_name")?.value || "",
      industry: document.getElementById("company_industry")?.value || "",
      email: document.getElementById("company_email")?.value || "",
      phone: document.getElementById("company_phone")?.value || "",
    }),
  });
  alert("Company details saved successfully!");
}

async function savePreferences() {
  const user = getSettingsUser() || {};
  await settingsRequest("/preferences", {
    method: "PUT",
    body: JSON.stringify({
      userId: user.user_id || user.userId,
      username: user.username,
      darkMode: !!document.getElementById("darkModeToggle")?.checked,
      colorTheme: document.getElementById("theme")?.value || "default",
      emailNotifications: !!document.getElementById("emailNotifications")?.checked,
      pushNotifications: !!document.getElementById("pushNotifications")?.checked,
      attendanceAlerts: !!document.getElementById("attendanceAlerts")?.checked,
    }),
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try { await loadSettings(); } catch (error) { console.error(error); }

  document.getElementById("saveCompanyBtn")?.addEventListener("click", async () => {
    try { await saveCompany(); } catch (error) { alert(error.message); }
  });

  ["darkModeToggle", "emailNotifications", "pushNotifications", "attendanceAlerts", "theme"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => savePreferences().catch(console.error));
  });
});

window.selectAvatar = function selectAvatar(imagePath) {
  const user = getSettingsUser();
  if (user) {
    user.avatar = imagePath;
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
  }
  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((img) => { img.src = imagePath; });
};
