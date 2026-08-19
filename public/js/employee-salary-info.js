(() => {
  "use strict";

  const money = value => `R${Number(value || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const getText = id => document.getElementById(id)?.textContent?.trim() || "—";
  const getUser = () => { try { return JSON.parse(localStorage.getItem("currentUser")) || {}; } catch { return {}; } };

  function createSalaryPanel() {
    const card = [...document.querySelectorAll(".emp-files-col .emp-card")]
      .find(card => card.querySelector("h3")?.textContent.includes("Salary & Latest Payroll"));
    if (!card || document.getElementById("salary-info-actions")) return;

    const header = card.querySelector(".emp-card-hd");
    const actions = document.createElement("div");
    actions.id = "salary-info-actions";
    actions.className = "emp-salary-actions";
    actions.innerHTML = `
      <button type="button" class="emp-salary-btn emp-salary-view" id="view-salary-info-btn"><i class="ri-eye-line"></i> View Salary Info</button>
      <button type="button" class="emp-salary-btn emp-salary-download" id="download-salary-info-btn"><i class="ri-download-2-line"></i> Download</button>`;
    header?.append(actions);

    const modal = document.createElement("div");
    modal.className = "emp-modal";
    modal.id = "salary-info-modal";
    modal.style.display = "none";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="emp-modal-box emp-salary-modal-box">
        <div class="emp-modal-head">
          <div><p class="emp-eyebrow"><i class="ri-money-rand-circle-line"></i> Salary Information</p><h2>Your Salary & Payroll Details</h2></div>
          <button type="button" class="emp-modal-close" id="close-salary-info-modal" aria-label="Close"><i class="ri-close-line"></i></button>
        </div>
        <div class="emp-salary-detail-grid">
          <div><span>Employee</span><strong id="salary-modal-name">—</strong></div>
          <div><span>Employee ID</span><strong id="salary-modal-id">—</strong></div>
          <div><span>Department</span><strong id="salary-modal-department">—</strong></div>
          <div><span>Position</span><strong id="salary-modal-position">—</strong></div>
          <div><span>Base Salary</span><strong id="salary-modal-base">—</strong></div>
          <div><span>Hours Worked</span><strong id="salary-modal-hours">—</strong></div>
          <div><span>Leave Deductions</span><strong id="salary-modal-deductions">—</strong></div>
          <div class="emp-salary-net"><span>Latest Net Pay</span><strong id="salary-modal-net">—</strong></div>
        </div>
        <p class="emp-salary-note">This salary information is based on the latest employee and payroll data available in your Modern Tech account.</p>
      </div>`;
    document.body.append(modal);

    document.getElementById("view-salary-info-btn")?.addEventListener("click", () => {
      populateModal();
      modal.style.display = "grid";
    });
    document.getElementById("close-salary-info-modal")?.addEventListener("click", () => modal.style.display = "none");
    modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; });
    document.getElementById("download-salary-info-btn")?.addEventListener("click", downloadSalaryInfo);
  }

  function populateModal() {
    const user = getUser();
    const values = {
      "salary-modal-name": getText("emp-profile-name"),
      "salary-modal-id": getText("emp-info-id"),
      "salary-modal-department": getText("emp-info-department"),
      "salary-modal-position": getText("emp-info-title"),
      "salary-modal-base": getText("salary-value"),
      "salary-modal-hours": getText("hours-value"),
      "salary-modal-deductions": getText("deductions-value"),
      "salary-modal-net": getText("net-pay-value")
    };
    Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value || "—"; });
    return user;
  }

  function downloadSalaryInfo() {
    const user = populateModal();
    const name = getText("emp-profile-name");
    const fileName = `Modern-Tech-Salary-Info-${String(name || user.username || "employee").replace(/[^a-z0-9]+/gi, "-")}.txt`;
    const content = [
      "MODERN TECH - SALARY INFORMATION",
      "=================================",
      `Employee: ${name}`,
      `Employee ID: ${getText("emp-info-id")}`,
      `Department: ${getText("emp-info-department")}`,
      `Position: ${getText("emp-info-title")}`,
      "",
      `Base Salary: ${getText("salary-value")}`,
      `Hours Worked: ${getText("hours-value")}`,
      `Leave Deductions: ${getText("deductions-value")}`,
      `Latest Net Pay: ${getText("net-pay-value")}`,
      "",
      `Generated: ${new Date().toLocaleString("en-ZA")}`
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("DOMContentLoaded", createSalaryPanel);
})();
