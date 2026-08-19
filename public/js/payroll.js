// payroll.js - handles data, modals, calculations, and PDF export
//
// UPDATED: now talks to the real Express/MySQL backend (payrollController.js /
// payroll.routes.js) instead of a static ./payroll_data.json file, and the
// custom payroll calculator submits to the backend instead of computing
// everything in the browser. Adjust API_BASE if your router is mounted
// somewhere other than /api/payroll.

const API_BASE = "/api/payroll";

const modalRoot = document.getElementById("modal-root");
const employeeCountEl = document.getElementById("dashboard-employees-count");
const employeeTotalEl = document.getElementById("dashboard-employees-total");
const customPayslipCountEl = document.getElementById("dashboard-custom-count");
const employeeFilterInput = document.getElementById("employee-filter");
let totalEmployees = 0;
let customPayslipCount = 0;
let validPositions = [];
let validDepartments = [];

function formatNumber(n) {
  if (typeof n !== "number") n = Number(n) || 0;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDateString(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizePayrollRecord(row) {
  return {
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeePosition: row.employee_position,
    employeeDepartment: row.employee_department,
    hoursWorked: row.hours_worked,
    leaveDeductions: row.leave_deductions,
    finalSalary: row.final_salary,
    payPeriodStart: row.pay_period_start,
    payPeriodEnd: row.pay_period_end,
  };
}

async function loadPayrollData() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Unable to load payroll data");
    const data = await res.json();
    if (!data.success)
      throw new Error(data.error || "Unable to load payroll data");

    data.payrollData.map(normalizePayrollRecord).forEach((emp) => {
      const section = document.querySelector(
        `.j-employee-info${emp.employeeId}`,
      );
      if (section) {
        section.id = `employee-card-${emp.employeeId}`;
        const article = document.createElement("article");
        article.className = "employee-card";
        article.innerHTML = `
          <h2>Employee ${emp.employeeId}</h2>
          <p><strong>Hours Worked:</strong> ${emp.hoursWorked}</p>
          <p><strong>Leave Deductions:</strong> ${emp.leaveDeductions}</p>
          <p><strong>Final Salary:</strong> R${formatNumber(emp.finalSalary)}</p>
        `;
        section.insertAdjacentElement("afterbegin", article);

        const payslipBtn = section.querySelector(".payslip-btn");
        if (payslipBtn) {
          payslipBtn.addEventListener("click", () =>
            openPayslipModal(emp.employeeId),
          );
        }

        const calcBtn = section.querySelector(".calc-btn");
        if (calcBtn) {
          calcBtn.addEventListener("click", () =>
            openCalcModal(emp.employeeId),
          );
        }
      }
    });
  } catch (err) {
    console.error(err);
    alert(
      "Could not load payroll data from the server. Please try again shortly.",
    );
  }
}

function updateEmployeeCounter() {
  const sections = document.querySelectorAll(
    '.j-employee-payroll-calc-info > section[class^="j-employee-info"]',
  );
  totalEmployees = sections.length;
  const visibleEmployees = Array.from(sections).filter(
    (sec) => sec.style.display !== "none",
  ).length;
  if (employeeCountEl) employeeCountEl.textContent = visibleEmployees;
  if (employeeTotalEl)
    employeeTotalEl.textContent = `/ ${totalEmployees} total`;
}

function updateCustomPayslipCount() {
  if (customPayslipCountEl) {
    customPayslipCountEl.textContent = customPayslipCount;
  }
}

function applyEmployeeFilter() {
  const query = employeeFilterInput?.value.trim().toLowerCase() || "";
  const sections = document.querySelectorAll(
    '.j-employee-payroll-calc-info > section[class^="j-employee-info"]',
  );
  sections.forEach((sec) => {
    const text = sec.textContent.toLowerCase();
    const show = !query || text.includes(query);
    sec.style.display = show ? "" : "none";
  });
  updateEmployeeCounter();
}

function initializeDashboard() {
  updateEmployeeCounter();
  updateCustomPayslipCount();
  if (employeeFilterInput) {
    employeeFilterInput.addEventListener("input", applyEmployeeFilter);
  }
}

async function fetchPayslip(employeeId) {
  const res = await fetch(`${API_BASE}/${employeeId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Unable to load payslip for this employee");
  }
  const emp = {
    employeeId: data.employee.employee_id,
    employeeName: data.employee.employee_name,
    employeePosition: data.employee.employee_position,
    employeeDepartment: data.employee.employee_department,
    payPeriodStart: data.employee.pay_period_start,
    payPeriodEnd: data.employee.pay_period_end,
  };
  return { emp, vals: data.payslip };
}

async function openPayslipModal(employeeId) {
  try {
    const { emp, vals } = await fetchPayslip(employeeId);
    const html = buildReceiptHTML(emp, vals);
    openModal({
      title: `Employee ${employeeId} Payslip`,
      body: html,
      type: "receipt",
    });
  } catch (err) {
    console.error(err);
    alert("Could not load this employee's payslip. Please try again.");
  }
}

async function openCalcModal(employeeId) {
  try {
    const { emp, vals } = await fetchPayslip(employeeId);
    const html = buildCalcHTML(emp, vals);
    openModal({
      title: `Employee ${employeeId} Calculation`,
      body: html,
      type: "calc",
    });
  } catch (err) {
    console.error(err);
    alert("Could not load this employee's calculation. Please try again.");
  }
}

function buildReceiptHTML(emp, vals) {
  return `
    <div class="receipt" data-type="receipt">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" role="img" aria-label="ModernTech Solutions Logo">
          <text x="50%" y="45%" font-family="Nunito Sans, sans-serif" font-weight="800" font-size="72" text-anchor="middle" fill="currentColor">MT</text>
          <text x="50%" y="85%" font-family="Nunito Sans, sans-serif" font-weight="700" font-size="20" text-anchor="middle" fill="currentColor">SOLUTIONS</text>
        </svg>
      </div>
      <h3>ModernTech Solutions</h3>
      <p><strong>Employee Name:</strong> ${escapeHtml(emp.employeeName || getEmpNameFromSection(emp.employeeId) || "")}</p>
      <p><strong>Employee ID:</strong> ${emp.employeeId}</p>
      <p><strong>Employee Position:</strong> ${escapeHtml(emp.employeePosition || getEmpPositionFromSection(emp.employeeId) || "")}</p>
      <p><strong>Employee Department:</strong> ${escapeHtml(emp.employeeDepartment || getEmpDeptFromSection(emp.employeeId) || "")}</p>
      <hr>
      <p><strong>Hourly Salary:</strong> R${formatNumber(vals.hourly)}</p>
      <p><strong>Daily Salary:</strong> R${formatNumber(vals.daily)}</p>
      <p><strong>Weekly Salary:</strong> R${formatNumber(vals.weekly)}</p>
      <p><strong>Monthly Salary:</strong> R${formatNumber(vals.monthly)}</p>
      <p><strong>Annual Salary:</strong> R${formatNumber(vals.annual)}</p>
      <p><strong>Pay Period:</strong> ${escapeHtml(emp.payPeriodStart && emp.payPeriodEnd ? `${formatDateString(emp.payPeriodStart)} - ${formatDateString(emp.payPeriodEnd)}` : "01 July 2026 - 31 July 2026")}</p>
      <p><strong>Gross Pay:</strong> R${formatNumber(vals.gross)}</p>
      <p><strong>Total Deductions:</strong> R${formatNumber(vals.totalDeductions)}</p>
      <p><strong>Net Pay:</strong> R${formatNumber(vals.net)}</p>
    </div>
  `;
}

function buildCalcHTML(emp, vals) {
  return `
    <div class="calc-sheet" data-type="calc">
      <h3>Calculation Sheet</h3>
      <div class="calc-formulas">
        <p><strong>Hourly Salary</strong> = finalSalary / (hoursWorked - leaveDeductions)</p>
        <p><strong>Daily Salary</strong> = hourly salary * 8</p>
        <p><strong>Weekly Salary</strong> = daily salary * 5</p>
        <p><strong>Monthly Salary</strong> = weekly salary * 4</p>
        <p><strong>Annual Salary</strong> = monthly salary * 12</p>
        <p><strong>Gross Pay</strong> = hourly salary * hoursWorked</p>
        <p><strong>Total Deductions</strong> = hourly salary * leaveDeductions</p>
        <p><strong>Net Pay</strong> = gross pay - total deductions = finalSalary</p>
      </div>
      <hr>
      <p><strong>Hourly Salary:</strong> R${formatNumber(vals.hourly)}</p>
      <p><strong>Daily Salary:</strong> R${formatNumber(vals.daily)}</p>
      <p><strong>Weekly Salary:</strong> R${formatNumber(vals.weekly)}</p>
      <p><strong>Monthly Salary:</strong> R${formatNumber(vals.monthly)}</p>
      <p><strong>Annual Salary:</strong> R${formatNumber(vals.annual)}</p>
      <p><strong>Gross Pay:</strong> R${formatNumber(vals.gross)}</p>
      <p><strong>Total Deductions:</strong> R${formatNumber(vals.totalDeductions)}</p>
      <p><strong>Net Pay:</strong> R${formatNumber(vals.net)}</p>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>\"']/g,
    (s) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[s],
  );
}

function getEmpNameFromSection(id) {
  const sec = document.querySelector(`.j-employee-info${id}`);
  if (!sec) return "";
  const p = Array.from(sec.querySelectorAll("p"))[0];
  return p ? p.textContent.replace("Employee Name:", "").trim() : "";
}

function getEmpPositionFromSection(id) {
  const sec = document.querySelector(`.j-employee-info${id}`);
  if (!sec) return "";
  const ps = Array.from(sec.querySelectorAll("p")).find((el) =>
    el.textContent.includes("Position"),
  );
  return ps ? ps.textContent.replace("Employee Position:", "").trim() : "";
}

function getEmpDeptFromSection(id) {
  const sec = document.querySelector(`.j-employee-info${id}`);
  if (!sec) return "";
  const ps = Array.from(sec.querySelectorAll("p")).find((el) =>
    el.textContent.includes("Department"),
  );
  return ps ? ps.textContent.replace("Employee Department:", "").trim() : "";
}

function openModal({ title = "", body = "", type = "receipt" }) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  const modal = document.createElement("div");
  modal.className = "modal";

  const header = document.createElement("div");
  header.className = "modal-header";
  const h = document.createElement("h2");
  h.textContent = title;
  header.appendChild(h);

  const controls = document.createElement("div");
  controls.className = "modal-controls";

  const colorRow = document.createElement("div");
  colorRow.className = "color-row";
  const bgSelect = document.createElement("select");
  const colors = [
    { label: "White", value: "#ffffff" },
    { label: "Black", value: "#000000" },
    { label: "Grey", value: "#808080" },
    { label: "Pastel Red", value: "#ffdddd" },
    { label: "Orange", value: "#ffe6cc" },
    { label: "Yellow", value: "#fff7cc" },
    { label: "Green", value: "#e6ffef" },
    { label: "Blue", value: "#e6eeff" },
    { label: "Purple", value: "#f0e6ff" },
  ];
  colors.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.value;
    opt.textContent = c.label;
    bgSelect.appendChild(opt);
  });

  colorRow.append("Background:");
  colorRow.appendChild(bgSelect);
  controls.appendChild(colorRow);

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";
  modalBody.innerHTML = body;

  function applyColors() {
    const bg = bgSelect.value;
    const inner = modalBody.querySelector("[data-type]");
    if (inner) {
      inner.style.background = bg;

      const useWhiteText = new Set(["#000000", "#808080"]).has(bg);
      const autoFont = useWhiteText ? "#ffffff" : "#111111";

      inner.style.color = autoFont;
      inner.style.setProperty("--content-color", autoFont);

      const logo = inner.querySelector(".logo svg");
      if (logo) {
        logo.style.color = autoFont;
      }
    }
    modal.style.background = getComputedStyle(document.body).backgroundColor;
  }
  bgSelect.addEventListener("change", applyColors);

  modal.appendChild(header);
  modal.appendChild(controls);
  modal.appendChild(modalBody);

  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const downloadFooter = document.createElement("button");
  downloadFooter.className = "modal-download";
  downloadFooter.textContent = "Download PDF";
  downloadFooter.addEventListener("click", () =>
    downloadModalAsPDF(modalBody, type),
  );

  const exitFooter = document.createElement("button");
  exitFooter.className = "modal-exit";
  exitFooter.textContent = "Exit";
  exitFooter.addEventListener("click", () => backdrop.remove());

  footer.appendChild(downloadFooter);
  footer.appendChild(exitFooter);
  modal.appendChild(footer);
  backdrop.appendChild(modal);
  modalRoot.appendChild(backdrop);

  bgSelect.value = "#ffffff";
  applyColors();
}

async function downloadModalAsPDF(modalBody, type) {
  try {
    const inner =
      document.querySelector(".modal-body [data-type]") ||
      document.querySelector(".modal-body");
    if (!inner) return;
    const isReceipt =
      inner.dataset.type === "receipt" || inner.classList.contains("receipt");
    const scale = 2;

    const clone = inner.cloneNode(true);
    const innerStyle = window.getComputedStyle(inner);
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = `${inner.offsetWidth}px`;
    clone.style.height = `${inner.offsetHeight}px`;
    clone.style.background = innerStyle.backgroundColor;
    clone.style.padding = innerStyle.padding;
    clone.style.margin = "0";
    clone.style.boxSizing = "border-box";
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale,
      background: window.getComputedStyle(clone).backgroundColor,
      useCORS: true,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      windowWidth: clone.offsetWidth,
      windowHeight: clone.offsetHeight,
    });

    document.body.removeChild(clone);
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const imgProps = pdf.getImageProperties(imgData);
    const imgRatio = imgProps.width / imgProps.height;
    let imgWidth = pageWidth - margin * 2;
    let imgHeight = imgWidth / imgRatio;

    if (imgHeight > pageHeight - margin * 2) {
      imgHeight = pageHeight - margin * 2;
      imgWidth = imgHeight * imgRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`${type || (isReceipt ? "receipt" : "document")}.pdf`);
  } catch (err) {
    console.error(err);
  }
}

const form = document.querySelector(".j-payroll-calc-form");
const payPdStrtInput = document.getElementById("payPdStrt");
const payPdEndInput = document.getElementById("payPdEnd");

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setFirstDayOfMonth(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function setLastDayOfMonth(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return formatLocalDate(lastDay);
}

let payPeriodSyncing = false;

function synchronizePayPeriodDates(direction) {
  if (!payPdStrtInput || !payPdEndInput) return;
  if (payPeriodSyncing) return;
  payPeriodSyncing = true;

  const startValue = payPdStrtInput.value;
  const endValue = payPdEndInput.value;

  if (direction === "start" && startValue) {
    const correctedStart = setFirstDayOfMonth(startValue);
    payPdStrtInput.value = correctedStart;
    payPdEndInput.value = setLastDayOfMonth(correctedStart);
  } else if (direction === "end" && endValue) {
    const correctedEnd = setLastDayOfMonth(endValue);
    payPdEndInput.value = correctedEnd;
    payPdStrtInput.value = setFirstDayOfMonth(correctedEnd);
  } else if (startValue) {
    const correctedStart = setFirstDayOfMonth(startValue);
    payPdStrtInput.value = correctedStart;
    payPdEndInput.value = setLastDayOfMonth(correctedStart);
  } else if (endValue) {
    const correctedEnd = setLastDayOfMonth(endValue);
    payPdEndInput.value = correctedEnd;
    payPdStrtInput.value = setFirstDayOfMonth(correctedEnd);
  }

  payPeriodSyncing = false;
}

if (payPdStrtInput) {
  payPdStrtInput.addEventListener("change", () =>
    synchronizePayPeriodDates("start"),
  );
}
if (payPdEndInput) {
  payPdEndInput.addEventListener("change", () =>
    synchronizePayPeriodDates("end"),
  );
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const empName = data.get("empName") || "";
    const empId = Number(data.get("empId")) || 0;
    const empPosition = (data.get("empPosition") || "").trim();
    const empDept = (data.get("empDept") || "").trim();
    const payPdStrt = data.get("payPdStrt") || "";
    const payPdEnd = data.get("payPdEnd") || "";
    const hrsWorked = Number(data.get("hrsWorked"));
    const leaveDeduct = Number(data.get("leaveDeduct"));
    const finSal = Number(data.get("finSal"));

    if (!empName || !empName.trim()) {
      alert("Employee Name is required. Please fill out all information.");
      return;
    }
    if (!empId || empId < 11) {
      alert("Employee ID must be 11 or higher because 1-10 are reserved.");
      return;
    }
    if (!empPosition || !empPosition.trim()) {
      alert(
        "Employee Position is required. Please select from the available options.",
      );
      return;
    }
    if (!empDept || !empDept.trim()) {
      alert(
        "Employee Department is required. Please select from the available options.",
      );
      return;
    }
    if (empPosition && !validPositions.includes(empPosition)) {
      alert(
        `Invalid Employee Position. Please select from the available options:\n\n${validPositions.join(", ")}`,
      );
      return;
    }
    if (empDept && !validDepartments.includes(empDept)) {
      alert(
        `Invalid Employee Department. Please select from the available options:\n\n${validDepartments.join(", ")}`,
      );
      return;
    }
    if (!payPdStrt || !payPdEnd) {
      alert("Please select both the pay period start and end dates.");
      return;
    }
    const startDate = new Date(payPdStrt);
    const endDate = new Date(payPdEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      alert("Please choose valid pay period dates.");
      return;
    }
    if (
      startDate.getFullYear() !== endDate.getFullYear() ||
      startDate.getMonth() !== endDate.getMonth()
    ) {
      alert("Start and end must be in the same month.");
      return;
    }
    if (startDate.getDate() !== 1) {
      alert("Pay period start must be the first day of the month.");
      return;
    }
    const lastDay = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
    ).getDate();
    if (endDate.getDate() !== lastDay) {
      alert("Pay period end must be the last day of the same month.");
      return;
    }
    if (!hrsWorked || hrsWorked <= 0 || isNaN(hrsWorked)) {
      alert(
        "Hours Worked is required and must be a positive number. Please fill out all information.",
      );
      return;
    }
    if (isNaN(leaveDeduct) || leaveDeduct < 0) {
      alert(
        "Leave Deductions is required and must be a valid number (0 or greater). Please fill out all information.",
      );
      return;
    }
    if (!finSal || finSal <= 0 || isNaN(finSal)) {
      alert(
        "Final Salary is required and must be a positive number. Please fill out all information.",
      );
      return;
    }

    const loaderHtml =
      `<div class="math-loader">` +
      `<div class="math-symbol">+</div><div class="math-symbol">-</div><div class="math-symbol">×</div><div class="math-symbol">÷</div>` +
      `</div>`;
    openModal({
      title: "Generating Payslip",
      body: loaderHtml,
      type: "loader",
    });

    function closeTopModal() {
      const backdrops = modalRoot.querySelectorAll(".modal-backdrop");
      if (backdrops.length) backdrops[backdrops.length - 1].remove();
    }

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId,
          empName,
          empPosition,
          empDept,
          payPdStrt,
          payPdEnd,
          hrsWorked,
          leaveDeduct,
          finSal,
        }),
      });
      const result = await res.json();
      closeTopModal();

      if (!res.ok || !result.success) {
        const message =
          (result.errors && result.errors.join("\n")) ||
          result.error ||
          "Unable to generate payslip. Please try again.";
        alert(message);
        return;
      }

      const emp = {
        employeeId: result.employee.employeeId,
        employeeName: result.employee.employeeName,
        employeePosition: result.employee.employeePosition,
        employeeDepartment: result.employee.employeeDepartment,
        payPeriodStart: result.payPeriodStart,
        payPeriodEnd: result.payPeriodEnd,
      };
      const receiptHtml = buildReceiptHTML(emp, result.payslip);
      openModal({
        title: `Custom Payslip - ${empName}`,
        body: receiptHtml,
        type: "receipt",
      });
      customPayslipCount += 1;
      updateCustomPayslipCount();
      form.reset();
    } catch (err) {
      console.error(err);
      closeTopModal();
      alert(
        "Could not reach the server to generate the payslip. Please try again.",
      );
    }
  });
}

async function normalizeEmployeeSections() {
  const sections = document.querySelectorAll(
    '.j-employee-payroll-calc-info > section[class^="j-employee-info"]',
  );
  sections.forEach((sec) => {
    const nestedButtons = Array.from(sec.querySelectorAll("section button"));
    if (nestedButtons.length) {
      const footer = document.createElement("div");
      footer.className = "card-actions";
      nestedButtons.forEach((btn) => {
        footer.appendChild(btn);
      });
      sec.appendChild(footer);
      const nestedSections = Array.from(
        sec.querySelectorAll(
          'section[class^="j-employee-payslip"], .j-calculations-digital-receipts',
        ),
      );
      nestedSections.forEach((s) => s.remove());
    }

    const topPs = Array.from(sec.querySelectorAll(":scope > p"));
    topPs.forEach((p) => {
      const txt = p.textContent || "";
      if (txt.includes(":")) {
        const idx = txt.indexOf(":");
        const label = txt.slice(0, idx).trim();
        const rest = txt.slice(idx + 1).trim();
        p.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(rest)}`;
      }
    });
  });
}

async function populatePositionsDepartmentsDatalist() {
  try {
    const res = await fetch(`${API_BASE}/options/positions-departments`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.warn("Could not fetch positions and departments");
      return;
    }

    validPositions = data.positions || [];
    validDepartments = data.departments || [];

    const positionsDatalist = document.getElementById("positionsList");
    if (positionsDatalist && data.positions) {
      positionsDatalist.innerHTML = data.positions
        .map((pos) => `<option value="${escapeHtml(pos)}"></option>`)
        .join("");
    }

    const departmentsDatalist = document.getElementById("departmentsList");
    if (departmentsDatalist && data.departments) {
      departmentsDatalist.innerHTML = data.departments
        .map((dept) => `<option value="${escapeHtml(dept)}"></option>`)
        .join("");
    }
  } catch (err) {
    console.error("Error populating position/department lists:", err);
  }
}

loadPayrollData()
  .then(() => normalizeEmployeeSections())
  .then(() => populatePositionsDepartmentsDatalist())
  .then(() => initializeDashboard());
