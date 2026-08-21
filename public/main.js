(() => {
  "use strict";
  const sharedButtons = document.createElement("link");
  sharedButtons.rel = "stylesheet";
  sharedButtons.href = "css/button-visibility.css";
  document.head.appendChild(sharedButtons);

  const responsive = document.createElement("link");
  responsive.rel = "stylesheet";
  responsive.href = "css/responsive.css";
  document.head.appendChild(responsive);

  const sidebar = document.getElementById("sidebar");
  const header = document.getElementById("header");
  const main = document.getElementById("main");
  const toggle = document.getElementById("header-toggle");
  const themeButton = document.getElementById("theme-button");

  const closeSidebar = () => {
    sidebar?.classList.remove("show-sidebar");
    header?.classList.remove("left-pd");
    main?.classList.remove("left-pd");
    toggle?.setAttribute("aria-expanded", "false");
  };

  toggle?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("show-sidebar");
    header?.classList.toggle("left-pd", open);
    main?.classList.toggle("left-pd", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth <= 700 && sidebar?.classList.contains("show-sidebar") && !sidebar.contains(event.target) && !toggle?.contains(event.target)) closeSidebar();
  });

  document.querySelectorAll("#sidebar .sidebar__list a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll("#sidebar .sidebar__list a").forEach((item) => item.classList.remove("active-link"));
      link.classList.add("active-link");
      if (window.innerWidth <= 1024) closeSidebar();
    });
  });

  const darkTheme = "dark-theme";
  const savedTheme = localStorage.getItem("selected-theme");
  if (savedTheme === "dark") document.body.classList.add(darkTheme);
  const syncThemeButton = () => {
    if (!themeButton) return;
    const dark = document.body.classList.contains(darkTheme);
    const icon = themeButton.querySelector("i");
    if (icon) icon.className = dark ? "ri-sun-fill" : "ri-moon-clear-fill";
    const label = themeButton.querySelector("span");
    if (label) label.textContent = dark ? "Light Mode" : "Dark Mode";
  };
  syncThemeButton();
  themeButton?.addEventListener("click", (event) => {
    event.preventDefault();
    document.body.classList.toggle(darkTheme);
    localStorage.setItem("selected-theme", document.body.classList.contains(darkTheme) ? "dark" : "light");
    syncThemeButton();
  });
  document.getElementById("logout-btn")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); }
  });
})();
