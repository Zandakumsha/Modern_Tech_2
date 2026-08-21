/* Modern Tech shared HR client utilities */
const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
  const toggle = document.getElementById(toggleId), sidebar = document.getElementById(sidebarId), header = document.getElementById(headerId), main = document.getElementById(mainId);
  if (!toggle || !sidebar) return;
  const close = () => { sidebar.classList.remove("show-sidebar"); header?.classList.remove("left-pd"); main?.classList.remove("left-pd"); };
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("show-sidebar");
    header?.classList.toggle("left-pd");
    main?.classList.toggle("left-pd");
    toggle.setAttribute("aria-expanded", sidebar.classList.contains("show-sidebar") ? "true" : "false");
  });
  document.addEventListener("click", (event) => {
    if (window.innerWidth <= 700 && sidebar.classList.contains("show-sidebar") && !sidebar.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.querySelectorAll(".sidebar__list a").forEach((link) => link.addEventListener("click", close));
};
showSidebar("header-toggle", "sidebar", "header", "main");

const currentPage = window.location.pathname.split("/").pop() || "index.html";
const HR_PAGES = ["index.html", "data.html", "payroll.html", "attendance.html", "calendar.html", "notifications.html", "settings.html", "reviews.html"];
const isHrPage = HR_PAGES.includes(currentPage);
const getStoredUser = () => {
  for (const key of ["currentUser", "user"]) {
    const value = localStorage.getItem(key);
    if (!value) continue;
    try { return JSON.parse(value); } catch { /* ignore malformed legacy storage */ }
  }
  return null;
};
const storedUser = getStoredUser();
const hasSession = sessionStorage.getItem("authenticated") === "true";
const hasToken = Boolean(localStorage.getItem("authToken"));
const isHrUser = storedUser && ["Admin", "Manager"].includes(storedUser.role);
if (isHrPage && (!hasSession || !hasToken)) {
  window.location.replace("login.html");
} else if (isHrPage && !isHrUser) {
  window.location.replace("employee.html");
}

/* Shared responsive stylesheet. Older HR pages did not all link it. */
if (!document.querySelector('link[data-shared-responsive]')) {
  const responsive = document.createElement("link");
  responsive.rel = "stylesheet";
  responsive.href = "css/responsive.css";
  responsive.dataset.sharedResponsive = "true";
  document.head.appendChild(responsive);
}

const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "ri-sun-fill";
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () => themeButton && themeButton.classList.contains(iconTheme) ? "ri-moon-clear-fill" : "ri-sun-fill";
if (selectedTheme) document.body.classList.toggle(darkTheme, selectedTheme === "dark");
if (themeButton) {
  themeButton.classList.toggle(iconTheme, selectedIcon === "ri-moon-clear-fill");
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle(darkTheme);
    themeButton.classList.toggle(iconTheme);
    localStorage.setItem("selected-theme", getCurrentTheme());
    localStorage.setItem("selected-icon", getCurrentIcon());
    const toggle = document.getElementById("darkModeToggle");
    if (toggle) toggle.checked = document.body.classList.contains(darkTheme);
  });
}

const themes = {
  default: { primary: "#00674f", light: "#dbeafe", hover: "#00674f" },
  blue: { primary: "#2563eb", light: "#dbeafe", hover: "#1d4ed8" },
  green: { primary: "#16a34a", light: "#dcfce7", hover: "#15803d" },
  purple: { primary: "#7c3aed", light: "#ede9fe", hover: "#6d28d9" },
  red: { primary: "#dc2626", light: "#fee2e2", hover: "#b91c1c" },
  orange: { primary: "#ea580c", light: "#ffedd5", hover: "#c2410c" },
};
function applyTheme(name) {
  const theme = themes[name] || themes.default;
  document.documentElement.style.setProperty("--primary-color", theme.primary);
  document.documentElement.style.setProperty("--primary-light", theme.light);
  document.documentElement.style.setProperty("--hover-color", theme.hover);
  document.documentElement.style.setProperty("--footer-color", theme.primary);
}
const themeSelect = document.getElementById("theme");
const savedTheme = localStorage.getItem("color-theme") || "default";
applyTheme(savedTheme);
if (themeSelect) {
  themeSelect.value = savedTheme;
  themeSelect.addEventListener("change", function () { applyTheme(this.value); localStorage.setItem("color-theme", this.value); });
}
function setTheme(primary, light, hover) { applyTheme("default"); document.documentElement.style.setProperty("--primary-color", primary); document.documentElement.style.setProperty("--primary-light", light); document.documentElement.style.setProperty("--hover-color", hover); document.documentElement.style.setProperty("--footer-color", primary); }

const DEFAULT_AVATAR = "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";
function saveCurrentUser(user) { if (user) { localStorage.setItem("currentUser", JSON.stringify(user)); localStorage.setItem("user", JSON.stringify(user)); } }
function applyAvatar(imagePath) {
  const avatarPath = imagePath || DEFAULT_AVATAR;
  localStorage.setItem("selectedAvatar", avatarPath);
  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((image) => { image.src = avatarPath; });
  document.querySelectorAll(".settings_avatar-option").forEach((option) => option.classList.toggle("active", option.getAttribute("src") === avatarPath));
}
function syncProfileInfo() {
  const user = getStoredUser();
  const values = {
    "sidebar-user-name": user?.username || "User",
    "sidebar-user-email": user?.email || "user@email.com",
    "sidebar_role": user?.role || "Admin",
  };
  Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
  const username = document.getElementById("settings_username"), email = document.getElementById("settings_email"), role = document.getElementById("settings_role");
  if (username) username.value = user?.username || "";
  if (email) email.value = user?.email || "";
  if (role) role.value = user?.role || "Admin";
  applyAvatar(localStorage.getItem("selectedAvatar") || user?.avatar || DEFAULT_AVATAR);
}

function ensureNotificationsNavigation() {
  const settingsList = Array.from(document.querySelectorAll(".sidebar__title")).find((title) => title.textContent.trim().toUpperCase() === "SETTINGS")?.parentElement?.querySelector(".sidebar__list");
  if (settingsList && !settingsList.querySelector('a[href="notifications.html"]')) {
    const link = document.createElement("a");
    link.href = "notifications.html";
    link.className = "sidebar__link";
    link.innerHTML = '<i class="ri-notification-3-fill"></i><span>Notifications</span><span id="notification-count" class="notification-badge">0</span>';
    settingsList.insertBefore(link, settingsList.firstElementChild);
  }
  document.querySelectorAll('.sidebar__list a[href="notifications.html"]').forEach((link) => link.classList.toggle("active-link", currentPage === "notifications.html"));
}

function ensureNotificationsFooter() {
  if (currentPage === "login.html" || document.body.classList.contains("login-page")) return;
  if (!document.querySelector('link[data-hr-footer-style]')) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "css/footer.css";
    style.dataset.hrFooterStyle = "true";
    document.head.appendChild(style);
  }
  const main = document.querySelector("main.main");
  if (!main) return;
  let footer = main.querySelector("footer") || document.createElement("footer");
  if (footer.parentElement !== main) main.appendChild(footer);
  footer.innerHTML = `<div class="footer_container"><div class="footer_content"><i class="ri-cloud-fill"></i><h2>Modern Tech</h2><p>Modern Technology Solutions is a leading provider of HR management solutions.</p></div><div class="footer-col"><h3>Links</h3><ul><li><a href="index.html">Dashboard</a></li><li><a href="data.html">Employees Data</a></li><li><a href="payroll.html">Payroll</a></li><li><a href="attendance.html">Attendance</a></li><li><a href="calendar.html">Calendar</a></li><li><a href="notifications.html">Notifications</a></li><li><a href="settings.html">Settings</a></li><li><a href="reviews.html">Reviews</a></li></ul></div><div class="footer-col"><h3>Contact Us</h3><ul><li><i class="ri-mail-fill"></i> info@modern-tech.com</li><li><i class="ri-phone-fill"></i> +1 234 567 890</li><li><i class="ri-map-pin-fill"></i> 314 Imam Haron Road, Lansdowne 7780</li></ul></div><div class="footer-col"><h3>Follow Us</h3><ul><li><i class="ri-github-fill"></i><a href="https://github.com/Zandakumsha/Modern_Tech_2">Github</a></li><li><i class="ri-linkedin-fill"></i><a href="#">LinkedIn</a></li></ul></div></div><hr /><p class="footer_copy">&copy; ${new Date().getFullYear()} Modern Tech. All rights reserved.</p>`;
}

const logout = () => {
  sessionStorage.clear();
  ["currentUser", "user", "employeeId", "authToken", "selectedAvatar"].forEach((key) => localStorage.removeItem(key));
  window.location.replace("login.html");
};
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
  logoutBtn.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); logout(); } });
}

document.addEventListener("DOMContentLoaded", () => {
  ensureNotificationsNavigation();
  ensureNotificationsFooter();
  syncProfileInfo();
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = document.body.classList.contains(darkTheme);
    darkModeToggle.addEventListener("change", () => {
      document.body.classList.toggle(darkTheme, darkModeToggle.checked);
      localStorage.setItem("selected-theme", darkModeToggle.checked ? "dark" : "light");
      localStorage.setItem("selected-icon", darkModeToggle.checked ? "ri-moon-clear-fill" : "ri-sun-fill");
    });
  }
  ["emailNotifications", "pushNotifications", "attendanceAlerts"].forEach((id) => {
    const toggle = document.getElementById(id);
    if (!toggle) return;
    const saved = localStorage.getItem(id);
    if (saved !== null) toggle.checked = saved === "true";
    toggle.addEventListener("change", () => localStorage.setItem(id, String(toggle.checked)));
  });
});

function selectAvatar(imagePath) {
  const user = getStoredUser();
  if (user) { user.avatar = imagePath; saveCurrentUser(user); }
  applyAvatar(imagePath);
}
window.selectAvatar = selectAvatar;
