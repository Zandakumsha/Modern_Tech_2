// Modern Tech - Role-based HR and Employee authentication
(() => {
  "use strict";

  const loginContainer = document.querySelector(".login_container");
  const signUpBtn = document.getElementById("login_sign-up-btn");
  const signInBtn = document.getElementById("login_sign-in-btn");

  const hrForm = document.getElementById("login-auth-form");
  const hrUsernameInput = document.getElementById("login-hr-username");
  const hrPasswordInput = document.getElementById("login-password");
  const hrSubmit = document.getElementById("login-submit");
  const hrMessage = document.getElementById("login-message");

  const employeeForm = document.getElementById("employee-auth-form");
  const employeeIdInput = document.getElementById("login-employee-id");
  const employeeSubmit = document.getElementById("employee-submit");
  const employeeMessage = document.getElementById("employee-message");

  if (!loginContainer || !signUpBtn || !signInBtn || !hrForm || !employeeForm) return;

  function getStoredUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  }

  if (sessionStorage.getItem("authenticated") && window.location.pathname.includes("login.html")) {
    const user = getStoredUser();

    if (user?.role === "Staff" && user.employeeId) {
      window.location.href = "employee.html";
      return;
    }

    if (user?.role === "Admin" || user?.role === "Manager") {
      window.location.href = "index.html";
      return;
    }
  }

  signUpBtn.addEventListener("click", () => {
    loginContainer.classList.add("login_sign-up-mode");
    employeeMessage.textContent = "";
  });

  signInBtn.addEventListener("click", () => {
    loginContainer.classList.remove("login_sign-up-mode");
    hrMessage.textContent = "";
  });

  async function requestLogin(payload) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  }

  function saveAuthenticatedUser(data) {
    const user = { ...(data.user || {}) };

    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));

    if (user.employeeId) {
      localStorage.setItem("employeeId", String(user.employeeId));
    }

    if (data.token) {
      localStorage.setItem("authToken", data.token);
    }

    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem(
      "username",
      user.username || user.email || String(user.employeeId || "User")
    );
    sessionStorage.setItem("role", user.role || "");
  }

  hrForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = hrUsernameInput.value.trim();

    if (!username) {
      hrMessage.textContent = "Please enter your HR username or email.";
      return;
    }

    hrSubmit.disabled = true;
    hrMessage.textContent = "Signing in...";

    try {
      const data = await requestLogin({ role: "hr", username });
      saveAuthenticatedUser(data);

      if (data.user?.role === "Staff") {
        throw new Error("This account is an employee account. Please use Employee Access.");
      }

      window.location.href = "index.html";
    } catch (error) {
      console.error("HR login error:", error);
      hrMessage.textContent = error.message || "Unable to sign in to the HR system.";
    } finally {
      hrSubmit.disabled = false;
      if (hrPasswordInput) hrPasswordInput.value = "";
    }
  });

  employeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const employeeId = employeeIdInput.value.trim();

    if (!employeeId) {
      employeeMessage.textContent = "Please enter your Employee ID.";
      return;
    }

    employeeSubmit.disabled = true;
    employeeMessage.textContent = "Verifying employee access...";

    try {
      const data = await requestLogin({ role: "employee", employeeId });
      saveAuthenticatedUser(data);

      if (data.user?.role !== "Staff") {
        throw new Error("This Employee ID is not linked to an employee account.");
      }

      window.location.href = "employee.html";
    } catch (error) {
      console.error("Employee access error:", error);
      employeeMessage.textContent = error.message || "Unable to access the employee portal.";
    } finally {
      employeeSubmit.disabled = false;
    }
  });
})();
