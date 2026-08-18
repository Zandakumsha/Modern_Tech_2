/*=============== SHOW SIDEBAR ===============*/
const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
  const toggle = document.getElementById(toggleId), sidebar = document.getElementById(sidebarId), header = document.getElementById(headerId), main = document.getElementById(mainId);
  if (toggle && sidebar && header && main) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("show-sidebar");
      header.classList.toggle("left-pd");
      main.classList.toggle("left-pd");
    });
  }
};
showSidebar("header-toggle", "sidebar", "header", "main");

/*=============== LINK ACTIVE / COLOR CHANGE ===============*/
const sidebarLink = document.querySelectorAll(".sidebar__list a");
function linkColor() {
  sidebarLink.forEach((l) => l.classList.remove("active-link"));
  this.classList.add("active-link");
}
sidebarLink.forEach((l) => l.addEventListener("click", linkColor));

/*=============== DARK LIGHT THEME ===============*/
const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "ri-sun-fill";
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () => themeButton && themeButton.classList.contains(iconTheme) ? "ri-moon-clear-fill" : "ri-sun-fill";
if (selectedTheme) document.body.classList[selectedTheme === "dark" ? "add" : "remove"](darkTheme);
if (themeButton) {
  if (selectedIcon === "ri-moon-clear-fill") themeButton.classList.add(iconTheme);
  else themeButton.classList.remove(iconTheme);
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);
    localStorage.setItem("selected-theme", getCurrentTheme());
    localStorage.setItem("selected-icon", getCurrentIcon());
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) darkModeToggle.checked = document.body.classList.contains(darkTheme);
  });
}

/*=============== THEME SWITCHER ===============*/
const themes = {
  default: { primary: "#00674f", light: "#dbeafe", hover: "#00674f" },
  blue: { primary: "#2563eb", light: "#dbeafe", hover: "#1d4ed8" },
  green: { primary: "#16a34a", light: "#dcfce7", hover: "#15803d" },
  purple: { primary: "#7c3aed", light: "#ede9fe", hover: "#6d28d9" },
  red: { primary: "#dc2626", light: "#fee2e2", hover: "#b91c1c" },
  orange: { primary: "#ea580c", light: "#ffedd5", hover: "#c2410c" },
};
const themeSelect = document.getElementById("theme");
const savedTheme = localStorage.getItem("color-theme") || "default";
applyTheme(savedTheme);
if (themeSelect) {
  themeSelect.value = savedTheme;
  themeSelect.addEventListener("change", function () {
    applyTheme(this.value);
    localStorage.setItem("color-theme", this.value);
  });
}
function applyTheme(name) {
  const theme = themes[name] || themes.default;
  document.documentElement.style.setProperty("--primary-color", theme.primary);
  document.documentElement.style.setProperty("--primary-light", theme.light);
  document.documentElement.style.setProperty("--hover-color", theme.hover);
  document.documentElement.style.setProperty("--footer-color", theme.primary);
}
function setTheme(primary, light, hover) {
  document.documentElement.style.setProperty("--primary-color", primary);
  document.documentElement.style.setProperty("--primary-light", light);
  document.documentElement.style.setProperty("--hover-color", hover);
  document.documentElement.style.setProperty("--footer-color", primary);
}

/*=============== PROFILE / AVATAR ===============*/
const DEFAULT_AVATAR = "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";
function getStoredUser() {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) { try { return JSON.parse(currentUser); } catch (error) { console.error("Unable to parse currentUser", error); } }
  const legacyUser = localStorage.getItem("user");
  if (legacyUser) { try { return JSON.parse(legacyUser); } catch (error) { console.error("Unable to parse stored user", error); } }
  return null;
}
function saveCurrentUser(user) {
  if (!user) return;
  localStorage.setItem("currentUser", JSON.stringify(user));
  localStorage.setItem("user", JSON.stringify(user));
}
function applyAvatar(imagePath) {
  const avatarPath = imagePath || DEFAULT_AVATAR;
  localStorage.setItem("selectedAvatar", avatarPath);
  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((image) => { if (image) image.src = avatarPath; });
  document.querySelectorAll(".settings_avatar-option").forEach((avatarOption) => avatarOption.classList.toggle("active", avatarOption.getAttribute("src") === avatarPath));
}
function syncProfileInfo() {
  const user = getStoredUser();
  const sidebarName = document.getElementById("sidebar-user-name");
  const sidebarEmail = document.getElementById("sidebar-user-email");
  const sidebarRole = document.getElementById("sidebar_role");
  const settingsUsername = document.getElementById("settings_username");
  const settingsEmail = document.getElementById("settings_email");
  const settingsRole = document.getElementById("settings_role");
  if (user) {
    if (sidebarName) sidebarName.textContent = user.username || "User";
    if (sidebarEmail) sidebarEmail.textContent = user.email || "user@email.com";
    if (sidebarRole) sidebarRole.textContent = user.role || "Admin";
    if (settingsUsername) settingsUsername.value = user.username || "";
    if (settingsEmail) settingsEmail.value = user.email || "";
    if (settingsRole) settingsRole.value = user.role || "Admin";
  } else {
    if (sidebarName) sidebarName.textContent = "User";
    if (sidebarEmail) sidebarEmail.textContent = "user@email.com";
    if (sidebarRole) sidebarRole.textContent = "Admin";
  }
  applyAvatar(localStorage.getItem("selectedAvatar") || user?.avatar || DEFAULT_AVATAR);
}

const protectedPages = ["index.html"];
const currentPage = window.location.pathname.split("/").pop();
if (!sessionStorage.getItem("authenticated") && protectedPages.includes(currentPage)) window.location.href = "login.html";

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("username");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("employeeId");
    window.location.href = "login.html";
  });
}

/*=============== HR NAVBAR ===============*/
// All HR pages use core.js. Employee Portal uses main.js, so this does not
// add HR navigation to the employee side.
function ensureHRNotificationsLink() {
  const page = window.location.pathname.split("/").pop().toLowerCase();
  if (page === "employee.html") return;
  const sidebar = document.querySelector("#sidebar .sidebar__content");
  if (!sidebar) return;
  const existing = sidebar.querySelector('a[href="notifications.html"]');
  if (existing) return;
  const settingsSection = Array.from(sidebar.querySelectorAll(".sidebar__title"))
    .find((title) => title.textContent.trim().toUpperCase() === "SETTINGS")?.parentElement;
  const targetList = settingsSection?.querySelector(".sidebar__list") || sidebar.querySelector(".sidebar__list:last-child");
  if (!targetList) return;
  const link = document.createElement("a");
  link.href = "notifications.html";
  link.className = "sidebar__link";
  link.innerHTML = '<i class="ri-notification-3-fill"></i><span>Notifications</span>';
  targetList.insertBefore(link, targetList.firstChild);
  if (page === "notifications.html") link.classList.add("active-link");
}

/*=============== DOM READY ===============*/
document.addEventListener("DOMContentLoaded", () => {
  syncProfileInfo();
  ensureHRNotificationsLink();
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = document.body.classList.contains("dark-theme");
    darkModeToggle.addEventListener("change", () => {
      document.body.classList.toggle("dark-theme", darkModeToggle.checked);
      localStorage.setItem("selected-theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
      localStorage.setItem("selected-icon", document.body.classList.contains("dark-theme") ? "ri-moon-clear-fill" : "ri-sun-fill");
    });
  }
  ["emailNotifications", "pushNotifications", "attendanceAlerts"].forEach((id) => {
    const toggle = document.getElementById(id);
    if (!toggle) return;
    const savedValue = localStorage.getItem(id);
    if (savedValue !== null) toggle.checked = savedValue === "true";
    toggle.addEventListener("change", () => localStorage.setItem(id, toggle.checked.toString()));
  });
});

function selectAvatar(imagePath) {
  const user = getStoredUser();
  if (user) { user.avatar = imagePath; saveCurrentUser(user); }
  applyAvatar(imagePath);
}
window.selectAvatar = selectAvatar;
