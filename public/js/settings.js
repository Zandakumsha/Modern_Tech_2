const SETTINGS_API = "/api/settings";

function getSettingsUser() {
  const keys = ["currentUser", "user"];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const user = JSON.parse(raw);
      if (user && (user.user_id || user.userId || user.username)) return user;
    } catch (error) {
      console.warn(`Ignoring invalid ${key} localStorage value`, error);
    }
  }

  // The authentication flow also stores the username in sessionStorage.
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
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Settings request failed");
  return body;
}

function setField(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null) element.value = value;
}

function setChecked(id, value) {
  const element = document.getElementById(id);
  if (element && value !== undefined && value !== null) element.checked = Boolean(value);
}

async function loadSettings() {
  const data = await settingsRequest();
  const user = data.user || getSettingsUser() || {};
  const company = data.company || {};
  const preferences = data.preferences || {};

  // These IDs match settings.html on feature/autha.
  setField("settings_username", user.username || "");
  setField("settings-email", user.email || "");
  setField("settings_role", user.role || "");
  setField("company_name", company.companyName || "");
  setField("company_industry", company.industry || "");
  setField("company_email", company.email || "");
  setField("company_phone", company.phone || "");

  setChecked("darkModeToggle", preferences.darkMode);
  setChecked("emailNotifications", preferences.emailNotifications);
  setChecked("pushNotifications", preferences.pushNotifications);
  setChecked("attendanceAlerts", preferences.attendanceAlerts);

  const theme = document.getElementById("theme");
  if (theme && preferences.colorTheme) theme.value = preferences.colorTheme;

  const avatar = user.avatar;
  if (avatar) {
    document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((img) => {
      img.src = avatar;
    });
  }

  // Keep the local auth profile synchronized with the authoritative API response.
  const stored = getSettingsUser();
  if (stored && data.user) {
    const merged = { ...stored, ...data.user };
    localStorage.setItem("currentUser", JSON.stringify(merged));
    localStorage.setItem("user", JSON.stringify(merged));
  }
}

async function saveCompany() {
  await settingsRequest("/company", {
    method: "PUT",
    body: JSON.stringify({
      companyName: document.getElementById("company_name")?.value?.trim() || "",
      industry: document.getElementById("company_industry")?.value?.trim() || "",
      email: document.getElementById("company_email")?.value?.trim() || "",
      phone: document.getElementById("company_phone")?.value?.trim() || "",
    }),
  });
  alert("Company details saved successfully!");
}

async function savePreferences() {
  const user = getSettingsUser();
  if (!user) throw new Error("No signed-in user was found. Please sign in again.");

  await settingsRequest("/preferences", {
    method: "PUT",
    body: JSON.stringify({
      userId: user.user_id || user.userId || user.id,
      username: user.username,
      darkMode: Boolean(document.getElementById("darkModeToggle")?.checked),
      colorTheme: document.getElementById("theme")?.value || "default",
      emailNotifications: Boolean(document.getElementById("emailNotifications")?.checked),
      pushNotifications: Boolean(document.getElementById("pushNotifications")?.checked),
      attendanceAlerts: Boolean(document.getElementById("attendanceAlerts")?.checked),
    }),
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadSettings();
  } catch (error) {
    console.error("Unable to load settings:", error);
    alert(error.message);
  }

  document.getElementById("saveCompanyBtn")?.addEventListener("click", async () => {
    try {
      await saveCompany();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });

  ["darkModeToggle", "emailNotifications", "pushNotifications", "attendanceAlerts", "theme"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", () => {
      savePreferences().catch((error) => console.error("Unable to save preferences:", error));
    });
  });
});

window.selectAvatar = function selectAvatar(imagePath) {
  const user = getSettingsUser();
  if (user) {
    user.avatar = imagePath;
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
  }

  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((img) => {
    img.src = imagePath;
  });
};
