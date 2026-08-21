/* ==========================================================
   Dashboard charts - database-backed analytics
   ========================================================== */

document.addEventListener("DOMContentLoaded", initCharts);

const chartObjects = {};
const chartColors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6", "#84CC16", "#F97316"];

async function initCharts() {
  setOverviewLoading(true);
  try {
    const response = await fetch("/api/dashboard/analytics", { headers: { Accept: "application/json" } });
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
    updateOverviewCards(data.overview);
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    setOverviewError();
  } finally {
    setOverviewLoading(false);
  }
}

function setOverviewLoading(isLoading) {
  document.querySelectorAll(".z_banner__item .overview-value").forEach((element) => {
    if (isLoading) element.textContent = "...";
  });
}

function setOverviewError() {
  document.querySelectorAll(".z_banner__item .overview-value").forEach((element) => {
    element.textContent = "—";
  });
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
  chartObjects.departmentChart = new Chart(ctx, { type: "doughnut", data: { labels: Object.keys(totals), datasets: [{ data: Object.values(totals), backgroundColor: chartColors }] }, options: { responsive: true, plugins: { legend: { position: "bottom" } } } });
}

function createSalaryChart(employees) {
  const ctx = getContext("salaryChart");
  if (!ctx) return;
  chartObjects.salaryChart = new Chart(ctx, { type: "bar", data: { labels: employees.map((employee) => employee.name), datasets: [{ label: "Salary", data: employees.map((employee) => Number(employee.salary) || 0), backgroundColor: "#2563EB", borderRadius: 8 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function createHoursChart(payroll, employees) {
  const ctx = getContext("hoursChart");
  if (!ctx) return;
  chartObjects.hoursChart = new Chart(ctx, { type: "bar", data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Hours Worked", data: payroll.map((item) => Number(item.hours_worked) || 0), backgroundColor: "#F59E0B", borderRadius: 8 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
}

function createLeaveChart(payroll, employees) {
  const ctx = getContext("leaveChart");
  if (!ctx) return;
  chartObjects.leaveChart = new Chart(ctx, { type: "pie", data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Leave Deductions", data: payroll.map((item) => Number(item.leave_deductions) || 0), backgroundColor: chartColors }] }, options: { responsive: true, plugins: { legend: { position: "bottom" } } } });
}

function createPayrollChart(payroll, employees) {
  const ctx = getContext("payrollChart");
  if (!ctx) return;
  chartObjects.payrollChart = new Chart(ctx, { type: "line", data: { labels: payroll.map((item) => employeeName(item.employee_id, employees)), datasets: [{ label: "Final Salary", data: payroll.map((item) => Number(item.final_salary) || 0), borderColor: "#10B981", backgroundColor: "rgba(16,185,129,.2)", fill: true, tension: 0.35 }] }, options: { responsive: true, scales: { y: { beginAtZero: true } } } });
}

function updateOverviewCards(overview) {
  if (!overview || typeof overview !== "object") {
    setOverviewError();
    return;
  }

  const values = {
    totalEmployees: Number(overview.totalEmployees || 0),
    pendingLeave: Number(overview.pendingLeave || 0),
    monthlyPayroll: Number(overview.monthlyPayroll || 0),
    attendanceRate: Number(overview.attendanceRate || 0),
  };

  const employeeCount = document.getElementById("overview-total-employees");
  const pendingLeave = document.getElementById("overview-pending-leave");
  const payrollTotal = document.getElementById("overview-monthly-payroll");
  const attendanceRate = document.getElementById("overview-attendance-rate");

  if (employeeCount) employeeCount.textContent = values.totalEmployees;
  if (pendingLeave) pendingLeave.textContent = values.pendingLeave;
  if (payrollTotal) payrollTotal.textContent = formatCurrency(values.monthlyPayroll);
  if (attendanceRate) attendanceRate.textContent = `${values.attendanceRate}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
