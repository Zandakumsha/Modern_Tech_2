// =========================
// Modern Tech Login + Workspace Selection
// =========================

const login_container = document.querySelector(".login_container");
const login_signUpBtn = document.getElementById("login_sign-up-btn");
const login_signInBtn = document.getElementById("login_sign-in-btn");
const login_loginForm = document.querySelector(".login_sign-in-form");
const login_signupForm = document.querySelector(".login_sign-up-form");
const workspaceModal = document.getElementById("workspaceModal");
const workspaceWelcome = document.getElementById("workspaceWelcome");
const hrWorkspace = document.getElementById("hrWorkspace");
const employeeWorkspace = document.getElementById("employeeWorkspace");
const workspaceCancel = document.getElementById("workspaceCancel");

const LOGIN_DEFAULT_AVATAR =
  "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function openWorkspaceChooser(user) {
  if (!workspaceModal) return;
  const name = user?.username ? `Welcome, ${user.username}.` : "Where would you like to go?";
  workspaceWelcome.textContent = `${name} Choose your workspace.`;
  workspaceModal.classList.add("show");
  workspaceModal.setAttribute("aria-hidden", "false");
}

function closeWorkspaceChooser() {
  if (!workspaceModal) return;
  workspaceModal.classList.remove("show");
  workspaceModal.setAttribute("aria-hidden", "true");
}

function enterWorkspace(workspace) {
  const user = getStoredUser() || {};
  const role = workspace === "employee" ? "Employee" : "Admin";
  const currentUser = { ...user, role };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  localStorage.setItem("selectedWorkspace", workspace);
  sessionStorage.setItem("authenticated", "true");
  sessionStorage.setItem("username", currentUser.username || "");
  sessionStorage.setItem("workspace", workspace);

  closeWorkspaceChooser();
  window.location.href = workspace === "employee" ? "employee.html" : "index.html";
}

if (login_container && login_signUpBtn && login_signInBtn && login_loginForm && login_signupForm) {
  // Keep an authenticated user from being shown the login form again.
  if (sessionStorage.getItem("authenticated") && window.location.pathname.includes("login.html")) {
    const existingWorkspace = sessionStorage.getItem("workspace");
    if (existingWorkspace === "employee") {
      window.location.href = "employee.html";
    } else if (existingWorkspace === "hr") {
      window.location.href = "index.html";
    }
  }

  login_signUpBtn.addEventListener("click", () => {
    login_container.classList.add("login_sign-up-mode");
  });

  login_signInBtn.addEventListener("click", () => {
    login_container.classList.remove("login_sign-up-mode");
  });

  // ======================
  // SIGN UP
  // ======================
  login_signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("login_signup-username").value.trim();
    const email = document.getElementById("login_signup-email").value.trim();
    const password = document.getElementById("login_signup-password").value.trim();

    if (!username || !email || !password) {
      alert("Please complete all fields.");
      return;
    }

    // New accounts start without a workspace. The user chooses after registration.
    const user = {
      username,
      email,
      password,
      role: "Employee",
      avatar: LOGIN_DEFAULT_AVATAR,
    };

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("currentUser", JSON.stringify(user));
    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", username);

    alert("Account created successfully!");
    openWorkspaceChooser(user);
  });

  // ======================
  // LOGIN
  // ======================
  login_loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("login_login-username").value.trim();
    const password = document.getElementById("login_login-password").value.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    const storedUser = getStoredUser();

    if (!storedUser) {
      alert("No account found. Please sign up first.");
      return;
    }

    if (username !== storedUser.username || password !== storedUser.password) {
      alert("Invalid username or password.");
      return;
    }

    const currentUser = {
      ...storedUser,
      avatar: storedUser.avatar || LOGIN_DEFAULT_AVATAR,
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("user", JSON.stringify(currentUser));
    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", currentUser.username);

    openWorkspaceChooser(currentUser);
  });
}

if (hrWorkspace) {
  hrWorkspace.addEventListener("click", () => enterWorkspace("hr"));
}

if (employeeWorkspace) {
  employeeWorkspace.addEventListener("click", () => enterWorkspace("employee"));
}

if (workspaceCancel) {
  workspaceCancel.addEventListener("click", () => {
    closeWorkspaceChooser();
    sessionStorage.removeItem("authenticated");
    sessionStorage.removeItem("workspace");
    sessionStorage.removeItem("username");
  });
}

if (workspaceModal) {
  workspaceModal.addEventListener("click", (event) => {
    if (event.target === workspaceModal) {
      closeWorkspaceChooser();
    }
  });
}
