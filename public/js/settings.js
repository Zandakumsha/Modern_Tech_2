// Settings page functionality (company details + profile sync extras)

// Save Company Details
const saveCompanyBtn = document.getElementById("saveCompanyBtn");

if (saveCompanyBtn) {
  saveCompanyBtn.addEventListener("click", () => {
    const companyData = {
      companyName: document.getElementById("company_name").value,
      industry: document.getElementById("company_industry").value,
      email: document.getElementById("company_email").value,
      phone: document.getElementById("company_phone").value,
    };

    localStorage.setItem("companyInfo", JSON.stringify(companyData));

    alert("Company details saved successfully!");
  });
}

// Load Company Details
document.addEventListener("DOMContentLoaded", () => {
  const company = JSON.parse(localStorage.getItem("companyInfo")) || {};

  const companyName = document.getElementById("company_name");
  const companyIndustry = document.getElementById("company_industry");
  const companyEmail = document.getElementById("company_email");
  const companyPhone = document.getElementById("company_phone");

  if (companyName) companyName.value = company.companyName || "";
  if (companyIndustry) companyIndustry.value = company.industry || "";
  if (companyEmail) companyEmail.value = company.email || "";
  if (companyPhone) companyPhone.value = company.phone || "";
});

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};

  const usernameField = document.getElementById("settings_username");
  const emailField = document.getElementById("settings-email");

  if (usernameField) {
    usernameField.value = currentUser.username || "";
  }

  if (emailField) {
    emailField.value = currentUser.email || "";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const company = JSON.parse(localStorage.getItem("companyInfo")) || {};

  const settingsCompanyName = document.getElementById("settings-company-name");
  const settingsCompanyIndustry = document.getElementById(
    "settings-company-industry",
  );
  const settingsCompanyEmail = document.getElementById(
    "settings-company-email",
  );
  const settingsCompanyPhone = document.getElementById(
    "settings-company-phone",
  );

  if (settingsCompanyName) settingsCompanyName.value = company.companyName || "";
  if (settingsCompanyIndustry)
    settingsCompanyIndustry.value = company.industry || "";
  if (settingsCompanyEmail) settingsCompanyEmail.value = company.email || "";
  if (settingsCompanyPhone) settingsCompanyPhone.value = company.phone || "";
});
