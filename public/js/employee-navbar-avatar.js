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

  const getEmployeeName = () => {
    const sidebarName = document.getElementById("sidebar-user-name")?.textContent?.trim();
    const profileName = document.getElementById("emp-profile-name")?.textContent?.trim();

    const validName = (name) =>
      name && name !== "Employee" && name !== "Loading..." && name !== "—";

    if (validName(sidebarName)) return sidebarName;
    if (validName(profileName)) return profileName;

    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
      return currentUser.name || currentUser.fullName || currentUser.username || "Employee";
    } catch {
      return "Employee";
    }
  };

  const renderEmployeeInitials = () => {
    const name = getEmployeeName();
    const initials = getInitials(name);

    document.querySelectorAll(".emp-avatar-photo").forEach((avatar) => {
      avatar.replaceChildren();
      avatar.textContent = initials;
      avatar.setAttribute("aria-label", `${name} initials`);
      avatar.setAttribute("title", name);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderEmployeeInitials();

    ["sidebar-user-name", "emp-profile-name"].forEach((id) => {
      const nameElement = document.getElementById(id);
      if (!nameElement) return;

      const observer = new MutationObserver(() => {
        // Wait until employee-profile.js has finished rendering before
        // replacing any avatar image with the employee's initials.
        queueMicrotask(renderEmployeeInitials);
      });

      observer.observe(nameElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  });
})();
