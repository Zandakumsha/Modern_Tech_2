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
  const employeePasswordInput = document.getElementById("login-employee-password");
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

  function clearAuthentication() {
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
    localStorage.removeItem("employeeId");
    localStorage.removeItem("authToken");
  }

  if (sessionStorage.getItem("authenticated") === "true" && localStorage.getItem("authToken") && window.location.pathname.includes("login.html")) {
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

  async function requestLogin(username, password) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) throw new Error(data.message || "Invalid username/email or password");
    if (!data.token || !data.user) throw new Error("The server returned an incomplete login response.");
    return data;
  }

  function saveAuthenticatedUser(data) {
    const user = { ...(data.user || {}) };
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
    if (user.employeeId) localStorage.setItem("employeeId", String(user.employeeId));
    localStorage.setItem("authToken", data.token);
    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", user.username || user.email || String(user.employeeId || "User"));
    sessionStorage.setItem("role", user.role || "");
  }

  function showMessage(element, message, success = false) {
    element.textContent = message;
    element.classList.toggle("login_success", success);
    element.classList.toggle("login_error", !success);
  }

  hrForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = hrUsernameInput.value.trim();
    const password = hrPasswordInput.value;

    if (!username || !password) {
      showMessage(hrMessage, "Please enter your username/email and password.");
      return;
    }

    hrSubmit.disabled = true;
    showMessage(hrMessage, "Signing in...", true);

    try {
      const data = await requestLogin(username, password);
      if (!['Admin', 'Manager'].includes(data.user?.role)) {
        clearAuthentication();
        throw new Error("This account does not have HR access. Use Employee Access instead.");
      }
      saveAuthenticatedUser(data);
      window.location.href = "index.html";
    } catch (error) {
      clearAuthentication();
      console.error("HR login error:", error);
      showMessage(hrMessage, error.message || "Unable to sign in to the HR system.");
    } finally {
      hrSubmit.disabled = false;
      hrPasswordInput.value = "";
    }
  });

  employeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const employeeId = employeeIdInput.value.trim();
    const password = employeePasswordInput.value;

    if (!employeeId || !password) {
      showMessage(employeeMessage, "Please enter your Employee ID and password.");
      return;
    }

    employeeSubmit.disabled = true;
    showMessage(employeeMessage, "Signing in...", true);

    try {
      const data = await requestLogin(employeeId, password);
      if (data.user?.role !== "Staff") {
        clearAuthentication();
        throw new Error("This account is not an employee account.");
      }
      if (String(data.user?.employeeId) !== String(employeeId)) {
        clearAuthentication();
        throw new Error("The Employee ID does not match this account.");
      }
      saveAuthenticatedUser(data);
      window.location.href = "employee.html";
    } catch (error) {
      clearAuthentication();
      console.error("Employee login error:", error);
      showMessage(employeeMessage, error.message || "Unable to access the employee portal.");
    } finally {
      employeeSubmit.disabled = false;
      employeePasswordInput.value = "";
    }
  });
})();
