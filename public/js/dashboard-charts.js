/* ==========================================================
                           Dashboard CHARTS
        ========================================================== */

document.addEventListener("DOMContentLoaded", initCharts);

let chartObjects = {};

const chartColors = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#14B8A6",
  "#84CC16",
  "#F97316",
];

async function initCharts() {
  try {
    const employeeResponse = await fetch("employee_info.json");
    const payrollResponse = await fetch("payroll_data.json");
    const attendanceResponse = await fetch("attendance.json");

    const employeeFile = await employeeResponse.json();
    const payrollFile = await payrollResponse.json();
    const attendanceFile = await attendanceResponse.json();

    const employees = employeeFile.employeeInformation;
    const payroll = payrollFile.payrollData;
    const attendance = attendanceFile.attendanceData;

    createDepartmentChart(employees);
    createSalaryChart(employees);
    createHoursChart(payroll);
    createLeaveChart(payroll);
    createPayrollChart(payroll);
    createAttendanceChart(attendance);
  } catch (error) {
    console.error(error);
  }
}

function destroyChart(id) {
  if (chartObjects[id]) {
    chartObjects[id].destroy();
  }

  return document.getElementById(id).getContext("2d");
}

/* ==========================================
         DEPARTMENT CHART
      ========================================== */

function createDepartmentChart(employees) {
  const totals = {};

  employees.forEach((employee) => {
    totals[employee.department] = (totals[employee.department] || 0) + 1;
  });

  const ctx = destroyChart("departmentChart");

  chartObjects.departmentChart = new Chart(ctx, {
    type: "doughnut",

    data: {
      labels: Object.keys(totals),

      datasets: [
        {
          data: Object.values(totals),

          backgroundColor: chartColors,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

/* ==========================================
         SALARY CHART
      ========================================== */

function createSalaryChart(employees) {
  const ctx = destroyChart("salaryChart");

  chartObjects.salaryChart = new Chart(ctx, {
    type: "bar",

    data: {
      labels: employees.map((e) => e.name),

      datasets: [
        {
          label: "Salary",

          data: employees.map((e) => e.salary),

          backgroundColor: "#2563EB",

          borderRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

/* ==========================================
         HOURS WORKED
      ========================================== */

function createHoursChart(payroll) {
  const ctx = destroyChart("hoursChart");

  chartObjects.hoursChart = new Chart(ctx, {
    type: "bar",

    data: {
      labels: payroll.map((e) => "EMP " + e.employeeId),

      datasets: [
        {
          label: "Hours Worked",

          data: payroll.map((e) => e.hoursWorked),

          backgroundColor: "#F59E0B",

          borderRadius: 8,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

/* ==========================================
         LEAVE DEDUCTIONS
      ========================================== */

function createLeaveChart(payroll) {
  const ctx = destroyChart("leaveChart");

  chartObjects.leaveChart = new Chart(ctx, {
    type: "pie",

    data: {
      labels: payroll.map((e) => "EMP " + e.employeeId),

      datasets: [
        {
          data: payroll.map((e) => e.leaveDeductions),

          backgroundColor: chartColors,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

/* ==========================================
         FINAL PAYROLL
      ========================================== */

function createPayrollChart(payroll) {
  const ctx = destroyChart("payrollChart");

  chartObjects.payrollChart = new Chart(ctx, {
    type: "line",

    data: {
      labels: payroll.map((e) => "EMP " + e.employeeId),

      datasets: [
        {
          label: "Final Salary",

          data: payroll.map((e) => e.finalSalary),

          borderColor: "#10B981",

          backgroundColor: "rgba(16,185,129,.2)",

          fill: true,

          tension: 0.35,
        },
      ],
    },

    options: {
      responsive: true,

      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

/* ==========================================
         ATTENDANCE %
      ========================================== */

function createAttendanceChart(attendance) {
  const attendancePercent = attendance.map((employee) => {
    const total = employee.attendance.length;

    const present = employee.attendance.filter(
      (day) => day.status === "Present",
    ).length;

    return Number(((present / total) * 100).toFixed(0));
  });

  const ctx = destroyChart("attendanceChart");

  chartObjects.attendanceChart = new Chart(ctx, {
    type: "line",

    data: {
      labels: attendance.map((e) => "EMP " + e.employeeId),

      datasets: [
        {
          label: "Attendance %",

          data: attendancePercent,

          borderColor: "#EF4444",

          backgroundColor: "rgba(239,68,68,.2)",

          fill: true,

          tension: 0.3,
        },
      ],
    },

    options: {
      responsive: true,

      scales: {
        y: {
          beginAtZero: true,

          max: 100,

          ticks: {
            callback: (value) => value + "%",
          },
        },
      },
    },
  });
}
