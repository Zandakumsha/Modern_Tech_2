// Modern Tech - Backend Authentication
(() => {
  "use strict";

  const loginContainer = document.querySelector(".login_container");
  const signUpBtn = document.getElementById("login_sign-up-btn");
  const signInBtn = document.getElementById("login_sign-in-btn");
  const loginForm = document.querySelector(".login_sign-in-form");
  const signupForm = document.querySelector(".login_sign-up-form");

  if (!loginContainer || !signUpBtn || !signInBtn || !loginForm || !signupForm) return;

  const DEFAULT_AVATAR = "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";

  if (sessionStorage.getItem("authenticated") && window.location.pathname.includes("login.html")) {
    const user = getStoredUser();
    window.location.href = user?.employeeId ? "employee.html" : "index.html";
    return;
  }

  signUpBtn.addEventListener("click", () => loginContainer.classList.add("login_sign-up-mode"));
  signInBtn.addEventListener("click", () => loginContainer.classList.remove("login_sign-up-mode"));

  async function requestAuth(endpoint, payload) {
    const response = await fetch(`/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) throw new Error(data.message || `Authentication failed (${response.status})`);
    return data;
  }

  function saveAuthenticatedUser(data) {
    const user = {
      ...(data.user || {}),
      avatar: data.user?.avatarUrl || data.user?.avatar || DEFAULT_AVATAR,
    };

    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
    if (user.employeeId) localStorage.setItem("employeeId", String(user.employeeId));
    localStorage.setItem("authToken", data.token);

    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", user.username || user.email || "User");
  }

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }

  function redirectAfterLogin(user) {
    // A database-linked employee goes to the employee portal.
    if (user?.employeeId) {
      window.location.href = "employee.html";
      return;
    }

    // Admin/manager/staff accounts without an employee profile use the dashboard.
    window.location.href = "index.html";
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login_signup-username")?.value.trim();
    const email = document.getElementById("login_signup-email")?.value.trim().toLowerCase();
    const password = document.getElementById("login_signup-password")?.value;

    if (!username || !email || !password) {
      alert("Please complete all fields.");
      return;
    }

    try {
      const data = await requestAuth("register", { username, email, password });
      saveAuthenticatedUser(data);

      alert(data.user?.employeeId
        ? "Account created and linked to your employee profile."
        : "Account created successfully.");

      redirectAfterLogin(data.user);
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.message || "Something went wrong while creating your account.");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login_login-username")?.value.trim();
    const password = document.getElementById("login_login-password")?.value;

    if (!username || !password) {
      alert("Please enter both username/email and password.");
      return;
    }

    try {
      const data = await requestAuth("login", { username, password });
      saveAuthenticatedUser(data);
      redirectAfterLogin(data.user);
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Invalid username/email or password.");
    }
  });
})();
