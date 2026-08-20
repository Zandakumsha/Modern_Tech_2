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

  function clearAuthentication() {
    ["currentUser", "user", "employeeId", "authToken"].forEach((key) => localStorage.removeItem(key));
    ["authenticated", "username", "role"].forEach((key) => sessionStorage.removeItem(key));
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

  signUpBtn.addEventListener("click", () => { loginContainer.classList.add("login_sign-up-mode"); employeeMessage.textContent = ""; });
  signInBtn.addEventListener("click", () => { loginContainer.classList.remove("login_sign-up-mode"); hrMessage.textContent = ""; });

  async function requestLogin(username, password, loginType) {
    let response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password, loginType }),
      });
    } catch {
      throw new Error("Unable to reach the authentication server. Make sure the backend is running.");
    }
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) throw new Error(data.message || "Authentication failed");
    if (!data.token || !data.user) throw new Error("The server returned an incomplete authentication response.");
    return data;
  }

  hrForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = hrUsernameInput.value.trim();
    const password = hrPasswordInput.value;
    if (!username || !password) return showMessage(hrMessage, "Enter your HR username/email and password.");
    hrSubmit.disabled = true;
    showMessage(hrMessage, "Authenticating HR credentials...", true);
    try {
      const data = await requestLogin(username, password, "hr");
      if (!["Admin", "Manager"].includes(data.user?.role)) throw new Error("This account is not authorised for HR access.");
      saveAuthenticatedUser(data);
      window.location.href = "index.html";
    } catch (error) {
      clearAuthentication();
      console.error("HR login error:", error);
      showMessage(hrMessage, error.message || "HR authentication failed.");
    } finally { hrSubmit.disabled = false; hrPasswordInput.value = ""; }
  });

  employeeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const employeeId = employeeIdInput.value.trim();
    const password = employeePasswordInput.value;
    if (!employeeId || !password) return showMessage(employeeMessage, "Enter your Employee ID and password.");
    employeeSubmit.disabled = true;
    showMessage(employeeMessage, "Signing in...", true);
    try {
      const data = await requestLogin(employeeId, password, "employee");
      if (data.user?.role !== "Staff") throw new Error("This account is not an employee account.");
      if (String(data.user?.employeeId) !== employeeId) throw new Error("The Employee ID does not match this account.");
      saveAuthenticatedUser(data);
      window.location.href = "employee.html";
    } catch (error) {
      clearAuthentication();
      console.error("Employee login error:", error);
      showMessage(employeeMessage, error.message || "Employee authentication failed.");
    } finally { employeeSubmit.disabled = false; employeePasswordInput.value = ""; }
  });
})();
