/*=============== SHOW SIDEBAR ===============*/
const showSidebar = (toggleId, sidebarId, headerId, mainId) => {
  const toggle = document.getElementById(toggleId), sidebar = document.getElementById(sidebarId), header = document.getElementById(headerId), main = document.getElementById(mainId);
  if (toggle && sidebar && header && main) toggle.addEventListener("click", () => { sidebar.classList.toggle("show-sidebar"); header.classList.toggle("left-pd"); main.classList.toggle("left-pd"); });
};
showSidebar("header-toggle", "sidebar", "header", "main");

const sidebarLink = document.querySelectorAll(".sidebar__list a");
function linkColor() { sidebarLink.forEach((l) => l.classList.remove("active-link")); this.classList.add("active-link"); }
sidebarLink.forEach((l) => l.addEventListener("click", linkColor));

const themeButton = document.getElementById("theme-button");
const darkTheme = "dark-theme";
const iconTheme = "ri-sun-fill";
const selectedTheme = localStorage.getItem("selected-theme");
const selectedIcon = localStorage.getItem("selected-icon");
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? "dark" : "light";
const getCurrentIcon = () => themeButton && themeButton.classList.contains(iconTheme) ? "ri-moon-clear-fill" : "ri-sun-fill";
if (selectedTheme) document.body.classList[selectedTheme === "dark" ? "add" : "remove"](darkTheme);
if (themeButton) {
  if (selectedIcon === "ri-moon-clear-fill") themeButton.classList.add(iconTheme); else themeButton.classList.remove(iconTheme);
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle(darkTheme); themeButton.classList.toggle(iconTheme);
    localStorage.setItem("selected-theme", getCurrentTheme()); localStorage.setItem("selected-icon", getCurrentIcon());
    const darkModeToggle = document.getElementById("darkModeToggle"); if (darkModeToggle) darkModeToggle.checked = document.body.classList.contains(darkTheme);
  });
}

const themes = {
  default: { primary: "#00674f", light: "#dbeafe", hover: "#00674f" }, blue: { primary: "#2563eb", light: "#dbeafe", hover: "#1d4ed8" }, green: { primary: "#16a34a", light: "#dcfce7", hover: "#15803d" }, purple: { primary: "#7c3aed", light: "#ede9fe", hover: "#6d28d9" }, red: { primary: "#dc2626", light: "#fee2e2", hover: "#b91c1c" }, orange: { primary: "#ea580c", light: "#ffedd5", hover: "#c2410c" }
};
const themeSelect = document.getElementById("theme");
const savedTheme = localStorage.getItem("color-theme") || "default";
applyTheme(savedTheme);
if (themeSelect) { themeSelect.value = savedTheme; themeSelect.addEventListener("change", function () { applyTheme(this.value); localStorage.setItem("color-theme", this.value); }); }
function applyTheme(name) { const theme = themes[name] || themes.default; document.documentElement.style.setProperty("--primary-color", theme.primary); document.documentElement.style.setProperty("--primary-light", theme.light); document.documentElement.style.setProperty("--hover-color", theme.hover); document.documentElement.style.setProperty("--footer-color", theme.primary); }
function setTheme(primary, light, hover) { document.documentElement.style.setProperty("--primary-color", primary); document.documentElement.style.setProperty("--primary-light", light); document.documentElement.style.setProperty("--hover-color", hover); document.documentElement.style.setProperty("--footer-color", primary); }

const DEFAULT_AVATAR = "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";
function getStoredUser() {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) { try { return JSON.parse(currentUser); } catch (error) { console.error("Unable to parse currentUser", error); } }
  const legacyUser = localStorage.getItem("user");
  if (legacyUser) { try { return JSON.parse(legacyUser); } catch (error) { console.error("Unable to parse stored user", error); } }
  return null;
}
function saveCurrentUser(user) { if (!user) return; localStorage.setItem("currentUser", JSON.stringify(user)); localStorage.setItem("user", JSON.stringify(user)); }
function applyAvatar(imagePath) {
  const avatarPath = imagePath || DEFAULT_AVATAR; localStorage.setItem("selectedAvatar", avatarPath);
  document.querySelectorAll("#navbarProfileImage, #settingsProfileImage").forEach((image) => { if (image) image.src = avatarPath; });
  document.querySelectorAll(".settings_avatar-option").forEach((avatarOption) => avatarOption.classList.toggle("active", avatarOption.getAttribute("src") === avatarPath));
}
function syncProfileInfo() {
  const user = getStoredUser(), sidebarName = document.getElementById("sidebar-user-name"), sidebarEmail = document.getElementById("sidebar-user-email"), sidebarRole = document.getElementById("sidebar_role"), settingsUsername = document.getElementById("settings_username"), settingsEmail = document.getElementById("settings_email"), settingsRole = document.getElementById("settings_role");
  if (user) { if (sidebarName) sidebarName.textContent = user.username || "User"; if (sidebarEmail) sidebarEmail.textContent = user.email || "user@email.com"; if (sidebarRole) sidebarRole.textContent = user.role || "Admin"; if (settingsUsername) settingsUsername.value = user.username || ""; if (settingsEmail) settingsEmail.value = user.email || ""; if (settingsRole) settingsRole.value = user.role || "Admin"; }
  else { if (sidebarName) sidebarName.textContent = "User"; if (sidebarEmail) sidebarEmail.textContent = "user@email.com"; if (sidebarRole) sidebarRole.textContent = "Admin"; }
  applyAvatar(localStorage.getItem("selectedAvatar") || user?.avatar || DEFAULT_AVATAR);
}

function ensureNotificationsNavigation() {
  const settingsList = Array.from(document.querySelectorAll(".sidebar__title")).find((title) => title.textContent.trim().toUpperCase() === "SETTINGS")?.parentElement?.querySelector(".sidebar__list");
  if (settingsList && !settingsList.querySelector('a[href="notifications.html"]')) {
    const link = document.createElement("a"); link.href = "notifications.html"; link.className = "sidebar__link"; link.innerHTML = '<i class="ri-notification-3-fill"></i><span>Notifications</span><span id="notification-count" class="notification-badge">0</span>'; settingsList.insertBefore(link, settingsList.firstElementChild);
  }
  document.querySelectorAll('.sidebar__list a[href="notifications.html"]').forEach((link) => { if (window.location.pathname.endsWith("/notifications.html")) link.classList.add("active-link"); });
}

/*=============== STANDARD HR FOOTER ===============*/
function ensureNotificationsFooter() {
  if (document.body.classList.contains("login-page") || window.location.pathname.endsWith("/login.html")) return;

  if (!document.querySelector('link[data-hr-footer-style]')) {
    const footerStyle = document.createElement("link");
    footerStyle.rel = "stylesheet";
    footerStyle.href = "css/footer.css";
    footerStyle.dataset.hrFooterStyle = "true";
    document.head.appendChild(footerStyle);
  }

  let footer = document.querySelector("footer");
  const main = document.querySelector("main.main");
  if (!footer) footer = document.createElement("footer");
  if (main && footer.parentElement !== main) main.appendChild(footer);

  footer.innerHTML = `
    <div class="footer_container">
      <div class="footer_content"><i class="ri-cloud-fill"></i><h2>Modern Tech</h2><p>Modern Technology Solutions is a leading provider of HR management solutions.</p></div>
      <div class="footer-col"><h3>Links</h3><ul>
        <li><a href="index.html">Dashboard</a></li>
        <li><a href="data.html">Employees Data</a></li>
        <li><a href="payroll.html">Payroll</a></li>
        <li><a href="attendance.html">Attendance</a></li>
        <li><a href="calendar.html">Calendar</a></li>
        <li><a href="notifications.html">Notifications</a></li>
        <li><a href="settings.html">Settings</a></li>
        <li><a href="reviews.html">Reviews</a></li>
      </ul></div>
      <div class="footer-col"><h3>Contact Us</h3><ul>
        <li><i class="ri-mail-fill"></i> info@modern-tech.com</li><li><i class="ri-phone-fill"></i> +1 234 567 890</li><li><i class="ri-map-pin-fill"></i> 314 Imam Haron Road, Lansdowne 7780</li>
      </ul></div>
      <div class="footer-col"><h3>Follow Us</h3><ul><li><i class="ri-github-fill"></i><a href="#">Github</a></li><li><i class="ri-linkedin-fill"></i><a href="#">LinkedIn</a></li></ul></div>
    </div>
    <hr /><p class="footer_copy">&copy; 2024 Modern Tech. All rights reserved.</p>`;
}

const protectedPages = ["index.html", "attendance.html"];
const currentPage = window.location.pathname.split("/").pop();
const hasSession = sessionStorage.getItem("authenticated") === "true";
const hasToken = Boolean(localStorage.getItem("authToken"));
if (protectedPages.includes(currentPage) && (!hasSession || !hasToken)) window.location.href = "login.html";

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) logoutBtn.addEventListener("click", () => { sessionStorage.removeItem("authenticated"); sessionStorage.removeItem("username"); localStorage.removeItem("currentUser"); localStorage.removeItem("user"); localStorage.removeItem("employeeId"); localStorage.removeItem("authToken"); window.location.href = "login.html"; });

document.addEventListener("DOMContentLoaded", () => {
  ensureNotificationsNavigation(); ensureNotificationsFooter(); syncProfileInfo();
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) { darkModeToggle.checked = document.body.classList.contains(darkTheme); darkModeToggle.addEventListener("change", () => { document.body.classList.toggle("dark-theme", darkModeToggle.checked); localStorage.setItem("selected-theme", document.body.classList.contains("dark-theme") ? "dark" : "light"); localStorage.setItem("selected-icon", document.body.classList.contains("dark-theme") ? "ri-moon-clear-fill" : "ri-sun-fill"); if (themeButton) { themeButton.classList.toggle("ri-sun-fill", !darkModeToggle.checked); themeButton.classList.toggle("ri-moon-clear-fill", darkModeToggle.checked); } }); }
  ["emailNotifications", "pushNotifications", "attendanceAlerts"].forEach((id) => { const toggle = document.getElementById(id); if (!toggle) return; const savedValue = localStorage.getItem(id); if (savedValue !== null) toggle.checked = savedValue === "true"; toggle.addEventListener("change", () => localStorage.setItem(id, toggle.checked.toString())); });
});

function selectAvatar(imagePath) { const user = getStoredUser(); if (user) { user.avatar = imagePath; saveCurrentUser(user); } applyAvatar(imagePath); }
window.selectAvatar = selectAvatar;
