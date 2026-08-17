/* ==========================================================
   Dashboard charts - database-backed analytics
   ========================================================== */

document.addEventListener("DOMContentLoaded", initCharts);

const chartObjects = {};
const chartColors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6", "#84CC16", "#F97316"];

async function initCharts() {
  try {
    const response = await fetch("/api/dashboard/analytics");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load dashboard analytics.");

    const employees = Array.isArray(data.employees) ? data.employees : [];
    const payroll = Array.isArray(data.payroll) ? data.payroll : [];
    const attendance = Array.isArray(data.attendance) ? data.attendance : [];

    createDepartmentChart(employees);
    createSalaryChart(employees);
    createHoursChart(payroll, employees);
    createLeaveChart(payroll, employees);
    createPayrollChart(payroll, employees);
    updateOverviewCards(data.overview, employees, payroll, attendance);
  } catch (error) {
    console.error("Dashboard chart error:", error);
  }
}

function getContext(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  if (chartObjects[id]) chartObjects[id].destroy();
  return canvas.getContext("2d");
}

function employeeName(employeeId, employees) {
  const employee = employees.find((item) => Number(item.employee_id) === Number(employeeId));
  return employee?.name || `EMP ${employeeId}`;
}

function createDepartmentChart(employees) {
  const ctx = getContext("departmentChart");
  if (!ctx) return;
  const totals = {};
  employees.forEach((employee) => {
    const department = employee.department || "Unassigned";
    totals[department] = (totals[department] || 0) + 1;
  });
  chartObjects.departmentChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels: Object.keys(totals), datasets: [{ data: Object.values(totals), backgroundColor: chartColors }] },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function createSalaryChart(employees) {
  const ctx = getContext("salaryChart");
  if (!ctx) return;
  chartObjects.salaryChart = new Chart(ctx, {
    type: "bar",
    data: { labels: employees.map((employee) => employee.name), datasets: [{ label: "Salary", data: employees.map((employee) => Number(employee.salary) || 0), backgroundColor: "#2563EB", borderRadius: 8 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function createHoursChart(payroll, employees) {
  const ctx = getContext("hoursChart");
  if (!ctx) return;
  chartObjects.hoursChart = new Chart(ctx, {
    type: "bar",
    data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Hours Worked", data: payroll.map((item) => Number(item.hours_worked) || 0), backgroundColor: "#F59E0B", borderRadius: 8 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
}

function createLeaveChart(payroll, employees) {
  const ctx = getContext("leaveChart");
  if (!ctx) return;
  chartObjects.leaveChart = new Chart(ctx, {
    type: "pie",
    data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Leave Deductions", data: payroll.map((item) => Number(item.leave_deductions) || 0), backgroundColor: chartColors }] },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function createPayrollChart(payroll, employees) {
  const ctx = getContext("payrollChart");
  if (!ctx) return;
  chartObjects.payrollChart = new Chart(ctx, {
    type: "line",
    data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Final Salary", data: payroll.map((item) => Number(item.final_salary) || 0), borderColor: "#10B981", backgroundColor: "rgba(16,185,129,.2)", fill: true, tension: 0.35 }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } },
  });
}

function updateOverviewCards(overview, employees, payroll, attendance) {
  const employeeCount = document.querySelector(".z_banner__item:nth-child(1) h1");
  const pendingLeave = document.querySelector(".z_banner__item:nth-child(2) h1");
  const payrollTotal = document.querySelector(".z_banner__item:nth-child(3) h1");
  const attendanceRate = document.querySelector(".z_banner__item:nth-child(4) h1");

  const fallback = {
    totalEmployees: employees.length,
    pendingLeave: 0,
    monthlyPayroll: payroll.reduce((sum, item) => sum + (Number(item.final_salary) || 0), 0),
    attendanceRate: attendance.length
      ? Math.round((attendance.filter((item) => String(item.status).toLowerCase() === "present").length / attendance.length) * 100)
      : 0,
  };
  const metrics = overview || fallback;

  if (employeeCount) employeeCount.textContent = Number(metrics.totalEmployees || 0);
  if (pendingLeave) pendingLeave.textContent = Number(metrics.pendingLeave || 0);
  if (payrollTotal) payrollTotal.textContent = formatCurrency(Number(metrics.monthlyPayroll || 0));
  if (attendanceRate) attendanceRate.textContent = `${Number(metrics.attendanceRate || 0)}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
