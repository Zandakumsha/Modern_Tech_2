import pool from "../config/db.js";

export async function getDashboardAnalytics(_req, res) {
  try {
    const [employees] = await pool.query("SELECT * FROM employees");
    const [payroll] = await pool.query("SELECT * FROM payroll");
    const [attendance] = await pool.query("SELECT * FROM attendance");

    return res.json({ employees, payroll, attendance });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    return res.status(500).json({ error: "Unable to load dashboard analytics." });
  }
}
