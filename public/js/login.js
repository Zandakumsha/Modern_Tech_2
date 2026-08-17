// =========================
// Login Functionality
// =========================

const login_container = document.querySelector(".login_container");
const login_signUpBtn = document.getElementById("login_sign-up-btn");
const login_signInBtn = document.getElementById("login_sign-in-btn");
const login_loginForm = document.querySelector(".login_sign-in-form");
const login_signupForm = document.querySelector(".login_sign-up-form");

if (
  login_container &&
  login_signUpBtn &&
  login_signInBtn &&
  login_loginForm &&
  login_signupForm
) {
  const LOGIN_DEFAULT_AVATAR =
    "https://i.ibb.co/gF6c7Yj8/Make-Something-Special-with-our-Adorable-Craft.jpg";

  // Redirect already-authenticated users straight to the dashboard
  if (
    sessionStorage.getItem("authenticated") &&
    window.location.pathname.includes("login.html")
  ) {
    window.location.href = "index.html";
  }

  // Toggle Sign In / Sign Up panels
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

    const username = document
      .getElementById("login_signup-username")
      .value.trim();

    const email = document.getElementById("login_signup-email").value.trim();

    const password = document
      .getElementById("login_signup-password")
      .value.trim();

    if (!username || !email || !password) {
      alert("Please complete all fields.");
      return;
    }

    const user = {
      username,
      email,
      password,
      role: "Admin",
      avatar: LOGIN_DEFAULT_AVATAR,
    };

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("currentUser", JSON.stringify(user));

    sessionStorage.setItem("authenticated", "true");
    sessionStorage.setItem("username", username);

    alert("Account created successfully!");

    window.location.href = "index.html";
  });

  // ======================
  // LOGIN
  // ======================
  login_loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document
      .getElementById("login_login-username")
      .value.trim();

    const password = document
      .getElementById("login_login-password")
      .value.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      alert("No account found. Please sign up first.");
      return;
    }

    if (username === storedUser.username && password === storedUser.password) {
      const currentUser = {
        ...storedUser,
        avatar: storedUser.avatar || LOGIN_DEFAULT_AVATAR,
      };

      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      localStorage.setItem("user", JSON.stringify(currentUser));

      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("username", storedUser.username);

      window.location.href = "index.html";
    } else {
      alert("Invalid username or password.");
    }
  });
}
