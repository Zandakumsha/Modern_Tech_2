import pool from "../config/db.js";

function getEmployeeId(req) {
  const id = Number(req.user?.employeeId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function safeQuery(sql, params, fallback = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    // Employee profile data should still load when an optional table has no data
    // or is not available yet. Log the problem for the server developer instead
    // of making the whole employee profile return 500.
    console.error("Employee profile optional query failed:", error.message);
    return fallback;
  }
}

export async function getMyEmployeeProfile(req, res) {
  const employeeId = getEmployeeId(req);

  if (!employeeId || req.user?.role !== "Staff") {
    return res.status(403).json({ message: "Employee access required" });
  }

  try {
    // The employees table is the source of truth for the employee portal.
    const employeeRows = await safeQuery(
      `SELECT employee_id AS employeeId, name, position, department,
              salary, employment_history AS employmentHistory, contact
       FROM employees
       WHERE employee_id = ?
       LIMIT 1`,
      [employeeId]
    );

    const employee = employeeRows[0];
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const userRows = await safeQuery(
      `SELECT username, email AS accountEmail, avatar_url AS avatarUrl
       FROM users
       WHERE employee_id = ? AND role = 'Staff'
       LIMIT 1`,
      [employeeId]
    );
    const user = userRows[0] || {};

    const payrollRows = await safeQuery(
      `SELECT payroll_id AS payrollId, pay_period_start AS payPeriodStart,
              pay_period_end AS payPeriodEnd, hours_worked AS hoursWorked,
              leave_deductions AS leaveDeductions, final_salary AS finalSalary
       FROM payroll WHERE employee_id = ?
       ORDER BY pay_period_end DESC, payroll_id DESC LIMIT 1`,
      [employeeId]
    );

    const attendanceRows = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END), 0) AS presentDays,
         COALESCE(SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END), 0) AS absentDays
       FROM attendance WHERE employee_id = ?`,
      [employeeId],
      [{}]
    );

    const leaveRows = await safeQuery(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END), 0) AS approvedLeave,
         COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) AS pendingLeave,
         COALESCE(SUM(CASE WHEN status = 'Denied' THEN 1 ELSE 0 END), 0) AS deniedLeave
       FROM leave_requests WHERE employee_id = ?`,
      [employeeId],
      [{}]
    );

    const payroll = payrollRows[0] || null;
    const attendance = attendanceRows[0] || {};
    const leave = leaveRows[0] || {};

    return res.json({
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        username: user.username || employee.name || String(employee.employeeId),
        email: user.accountEmail || employee.contact || "",
        phone: employee.contact || "",
        position: employee.position || "Not specified",
        department: employee.department || "Not specified",
        salary: Number(employee.salary || 0),
        employmentHistory: employee.employmentHistory || "Not recorded",
        employmentStatus: "Active",
        employmentType: "Full-time",
        manager: "HR Manager, Modern Tech",
        avatarUrl: user.avatarUrl || null,
      },
      payroll: payroll ? {
        payrollId: payroll.payrollId,
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        hoursWorked: Number(payroll.hoursWorked || 0),
        leaveDeductions: Number(payroll.leaveDeductions || 0),
        finalSalary: Number(payroll.finalSalary || 0),
      } : null,
      attendance: {
        presentDays: Number(attendance.presentDays || 0),
        absentDays: Number(attendance.absentDays || 0),
      },
      leave: {
        approved: Number(leave.approvedLeave || 0),
        pending: Number(leave.pendingLeave || 0),
        denied: Number(leave.deniedLeave || 0),
      },
    });
  } catch (error) {
    console.error("Employee profile failed:", error);
    return res.status(500).json({
      message: "Error retrieving employee profile",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}
