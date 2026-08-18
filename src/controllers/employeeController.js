import pool from "../config/db.js";

function getEmployeeId(req) {
  const id = Number(req.user?.employeeId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getMyEmployeeProfile(req, res) {
  const employeeId = getEmployeeId(req);

  if (!employeeId || req.user?.role !== "Staff") {
    return res.status(403).json({ message: "Employee access required" });
  }

  try {
    const [employeeRows] = await pool.query(
      `SELECT e.employee_id AS employeeId, e.name, e.position, e.department,
              e.salary, e.employment_history AS employmentHistory, e.contact,
              u.username, u.email AS accountEmail, u.avatar_url AS avatarUrl
       FROM employees e
       LEFT JOIN users u ON u.employee_id = e.employee_id AND u.role = 'Staff'
       WHERE e.employee_id = ?
       LIMIT 1`,
      [employeeId]
    );

    const employee = employeeRows[0];
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const [payrollRows] = await pool.query(
      `SELECT payroll_id AS payrollId, pay_period_start AS payPeriodStart,
              pay_period_end AS payPeriodEnd, hours_worked AS hoursWorked,
              leave_deductions AS leaveDeductions, final_salary AS finalSalary
       FROM payroll WHERE employee_id = ?
       ORDER BY pay_period_end DESC, payroll_id DESC LIMIT 1`,
      [employeeId]
    );

    const [attendanceRows] = await pool.query(
      `SELECT SUM(status = 'Present') AS presentDays,
              SUM(status = 'Absent') AS absentDays
       FROM attendance WHERE employee_id = ?`,
      [employeeId]
    );

    const [leaveRows] = await pool.query(
      `SELECT SUM(status = 'Approved') AS approvedLeave,
              SUM(status = 'Pending') AS pendingLeave,
              SUM(status = 'Denied') AS deniedLeave
       FROM leave_requests WHERE employee_id = ?`,
      [employeeId]
    );

    const payroll = payrollRows[0] || null;
    const attendance = attendanceRows[0] || {};
    const leave = leaveRows[0] || {};

    return res.json({
      employee: {
        employeeId: employee.employeeId,
        name: employee.name,
        username: employee.username || employee.name,
        email: employee.accountEmail || employee.contact,
        phone: employee.contact,
        position: employee.position,
        department: employee.department,
        salary: Number(employee.salary || 0),
        employmentHistory: employee.employmentHistory || "",
        employmentStatus: "Active",
        employmentType: "Full-time",
        manager: "D. Williams",
        avatarUrl: employee.avatarUrl || null,
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
