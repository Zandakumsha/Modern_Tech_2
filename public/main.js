(() => {
  "use strict";

  const sidebar = document.getElementById("sidebar");
  const header = document.getElementById("header");
  const main = document.getElementById("main");
  const toggle = document.getElementById("header-toggle");
  const themeButton = document.getElementById("theme-button");

  // Mobile/tablet sidebar toggle.
  toggle?.addEventListener("click", () => {
    sidebar?.classList.toggle("show-sidebar");
    header?.classList.toggle("left-pd");
    main?.classList.toggle("left-pd");
  });

  // Close the sidebar after selecting a navigation action on smaller screens.
  document.querySelectorAll("#sidebar .sidebar__list a").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll("#sidebar .sidebar__list a").forEach(item => item.classList.remove("active-link"));
      link.classList.add("active-link");
      if (window.innerWidth <= 1024) {
        sidebar?.classList.remove("show-sidebar");
        header?.classList.remove("left-pd");
        main?.classList.remove("left-pd");
      }
    });
  });

  // Keep the employee theme preference between visits.
  const darkTheme = "dark-theme";
  const savedTheme = localStorage.getItem("selected-theme");
  if (savedTheme === "dark") document.body.classList.add(darkTheme);

  themeButton?.addEventListener("click", event => {
    event.preventDefault();
    document.body.classList.toggle(darkTheme);
    localStorage.setItem("selected-theme", document.body.classList.contains(darkTheme) ? "dark" : "light");
    themeButton.querySelector("i")?.classList.toggle("ri-sun-fill", document.body.classList.contains(darkTheme));
  });

  // Make the navbar keyboard accessible.
  document.getElementById("logout-btn")?.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  });
})();
