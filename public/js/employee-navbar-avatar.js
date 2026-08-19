(() => {
  "use strict";

  const getInitials = (name) =>
    String(name || "Employee")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "E";

  const renderNavbarInitials = () => {
    const avatar = document.getElementById("emp-profile-avatar");
    const name = document.getElementById("sidebar-user-name")?.textContent;

    if (!avatar || !name || name === "Employee" || name === "Loading...") return;

    avatar.replaceChildren();
    avatar.textContent = getInitials(name);
    avatar.setAttribute("aria-label", `${name} initials`);
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderNavbarInitials();

    const nameElement = document.getElementById("sidebar-user-name");
    if (!nameElement) return;

    const observer = new MutationObserver(renderNavbarInitials);
    observer.observe(nameElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
})();
