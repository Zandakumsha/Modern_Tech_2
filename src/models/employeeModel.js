import pool from "../config/db.js";

export async function getAllEmployees() {
  const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact, created_at AS createdAt, updated_at AS updatedAt FROM employees ORDER BY employee_id ASC`);
  return rows;
}

export async function getEmployeeById(employeeId) {
  const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact, created_at AS createdAt, updated_at AS updatedAt FROM employees WHERE employee_id = ? LIMIT 1`, [employeeId]);
  return rows[0] || null;
}

export async function findEmployeeByContact(contact) {
  const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact, created_at AS createdAt, updated_at AS updatedAt FROM employees WHERE LOWER(contact) = LOWER(?) LIMIT 1`, [contact]);
  return rows[0] || null;
}

export async function createEmployee({ name, position, department, salary, employmentHistory, contact }) {
  const [result] = await pool.query(`INSERT INTO employees (name, position, department, salary, employment_history, contact) VALUES (?, ?, ?, ?, ?, ?)`, [name, position, department, salary, employmentHistory || null, contact]);
  return getEmployeeById(result.insertId);
}

export async function updateEmployee(employeeId, { name, position, department, salary, employmentHistory, contact }) {
  const [result] = await pool.query(`UPDATE employees SET name = ?, position = ?, department = ?, salary = ?, employment_history = ?, contact = ? WHERE employee_id = ?`, [name, position, department, salary, employmentHistory || null, contact, employeeId]);
  if (result.affectedRows === 0) return null;
  return getEmployeeById(employeeId);
}

export async function deleteEmployee(employeeId) {
  const [result] = await pool.query("DELETE FROM employees WHERE employee_id = ?", [employeeId]);
  return result.affectedRows > 0;
}

export async function getEmployeePayroll(employeeId) {
  const [rows] = await pool.query(`SELECT payroll_id AS payrollId, pay_period_start AS payPeriodStart, pay_period_end AS payPeriodEnd, hours_worked AS hoursWorked, leave_deductions AS leaveDeductions, final_salary AS finalSalary, created_at AS createdAt FROM payroll WHERE employee_id = ? ORDER BY COALESCE(pay_period_end, created_at) DESC, payroll_id DESC`, [employeeId]);
  return rows;
}

export async function getEmployeeAttendance(employeeId) {
  const [rows] = await pool.query(`SELECT attendance_id AS attendanceId, date, status FROM attendance WHERE employee_id = ? ORDER BY date DESC`, [employeeId]);
  return rows;
}

export async function getEmployeeLeave(employeeId) {
  const [rows] = await pool.query(`SELECT request_id AS requestId, date, reason, status, created_at AS createdAt, decided_at AS decidedAt FROM leave_requests WHERE employee_id = ? ORDER BY date DESC, request_id DESC`, [employeeId]);
  return rows;
}

export async function createLeaveRequest(employeeId, { date, reason }) {
  const [result] = await pool.query(`INSERT INTO leave_requests (employee_id, date, reason, status) VALUES (?, ?, ?, 'Pending')`, [employeeId, date, reason]);
  const [rows] = await pool.query(`SELECT request_id AS requestId, date, reason, status, created_at AS createdAt, decided_at AS decidedAt FROM leave_requests WHERE request_id = ?`, [result.insertId]);
  return rows[0];
}

export async function getEmployeeSummary(employeeId) {
  const employee = await getEmployeeById(employeeId);
  if (!employee) return null;

  const [[attendance]] = await pool.query(`SELECT COUNT(*) AS totalDays, COALESCE(SUM(status = 'Present'), 0) AS presentDays, COALESCE(SUM(status = 'Absent'), 0) AS absentDays FROM attendance WHERE employee_id = ?`, [employeeId]);
  const [[leave]] = await pool.query(`SELECT COUNT(*) AS totalRequests, COALESCE(SUM(status = 'Approved'), 0) AS approvedRequests, COALESCE(SUM(status = 'Pending'), 0) AS pendingRequests, COALESCE(SUM(status = 'Denied'), 0) AS deniedRequests FROM leave_requests WHERE employee_id = ?`, [employeeId]);
  const [payrollRows] = await pool.query(`SELECT payroll_id AS payrollId, pay_period_start AS payPeriodStart, pay_period_end AS payPeriodEnd, hours_worked AS hoursWorked, leave_deductions AS leaveDeductions, final_salary AS finalSalary, created_at AS createdAt FROM payroll WHERE employee_id = ? ORDER BY COALESCE(pay_period_end, created_at) DESC, payroll_id DESC LIMIT 1`, [employeeId]);

  return { employee, attendance, leave, latestPayroll: payrollRows[0] || null };
}
