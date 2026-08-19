import pool from "../config/db.js";

export async function getDashboardAnalytics(_req, res) {
  try {
    const [employees] = await pool.query("SELECT * FROM employees");
    const [payroll] = await pool.query("SELECT * FROM payroll");
    const [attendance] = await pool.query("SELECT * FROM attendance");
    const [pendingLeaveRows] = await pool.query(
      "SELECT COUNT(*) AS pendingLeave FROM leave_requests WHERE LOWER(status) = 'pending'"
    );

    return res.json({
      employees,
      payroll,
      attendance,
      overview: {
        totalEmployees: employees.length,
        pendingLeave: Number(pendingLeaveRows[0]?.pendingLeave || 0),
        monthlyPayroll: payroll.reduce(
          (total, item) => total + (Number(item.final_salary) || 0),
          0
        ),
        attendanceRate: attendance.length
          ? Math.round(
              (attendance.filter(
                (item) => String(item.status).toLowerCase() === "present"
              ).length /
                attendance.length) *
                100
            )
          : 0,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return res.status(500).json({ error: "Unable to load dashboard analytics." });
  }
}
