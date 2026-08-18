// controllers/payrollController.js
//
// Payroll controller — Person 3 (Payroll & Time-Off module)
// Handles: listing payroll records, generating digital payslips, and the
// "Custom Payroll Calculator" flow from payroll.html.
//
// NOTE: adjust the require path below to match wherever your shared DB
// connection pool actually lives (e.g. '../db', '../config/db').
// It's expected to be a mysql2/promise pool (pool.query / pool.getConnection).
import pool from "../config/db.js";

/**
 * Mirrors the exact formula used client-side in payroll.js so payslip
 * numbers stay consistent everywhere in the app.
 *   hourly   = finalSalary / (hoursWorked - leaveDeductions)
 *   daily    = hourly * 8
 *   weekly   = daily * 5
 *   monthly  = weekly * 4
 *   annual   = monthly * 12
 *   gross    = hourly * hoursWorked
 *   deducted = hourly * leaveDeductions
 *   net      = gross - deducted  (equals finalSalary by construction)
 */
function computePayroll(hoursWorked, leaveDeductions, finalSalary) {
  const hw = Number(hoursWorked);
  const ld = Number(leaveDeductions);
  const fs = Number(finalSalary);
  const divisor = hw - ld || 1;
  const hourly = fs / divisor;
  const daily = hourly * 8;
  const weekly = daily * 5;
  const monthly = weekly * 4;
  const annual = monthly * 12;
  const gross = hourly * hw;
  const totalDeductions = hourly * ld;
  const net = gross - totalDeductions;
  return {
    hourly,
    daily,
    weekly,
    monthly,
    annual,
    gross,
    totalDeductions,
    net,
  };
}

/**
 * Validates that a pay period is exactly one full calendar month
 * (mirrors the client-side checks already in payroll.js's form submit handler).
 */
function isValidCalendarMonth(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
    return false;
  if (
    start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth()
  )
    return false;
  if (start.getDate() !== 1) return false;
  const lastDay = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();
  if (end.getDate() !== lastDay) return false;
  return true;
}

/**
 * GET /api/payroll
 * Returns every employee joined with their most recent payroll record.
 * Intended to replace the static ./payroll_data.json fetch currently in payroll.js.
 */
async function getAllPayroll(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT e.employee_id, e.name AS employee_name, e.position AS employee_position,
              e.department AS employee_department,
              p.payroll_id, p.pay_period_start, p.pay_period_end,
              p.hours_worked, p.leave_deductions, p.final_salary
       FROM employees e
       JOIN payroll p ON p.employee_id = e.employee_id
       WHERE p.payroll_id IN (
         SELECT MAX(payroll_id) FROM payroll GROUP BY employee_id
       )
       ORDER BY e.employee_id ASC`,
    );
    res.status(200).json({ success: true, payrollData: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payroll/:employeeId
 * Returns the most recent payroll record + computed payslip values for one employee.
 * Powers both the "Digital Payslip" and "See How It's Calculated" buttons server-side.
 */
async function getPayrollByEmployee(req, res, next) {
  try {
    const { employeeId } = req.params;
    if (!Number.isInteger(Number(employeeId)) || Number(employeeId) <= 0) {
      return res.status(400).json({
        success: false,
        error: "employeeId must be a positive integer",
      });
    }

    const [rows] = await pool.query(
      `SELECT e.employee_id, e.name AS employee_name, e.position AS employee_position,
              e.department AS employee_department,
              p.payroll_id, p.pay_period_start, p.pay_period_end,
              p.hours_worked, p.leave_deductions, p.final_salary
       FROM employees e
       JOIN payroll p ON p.employee_id = e.employee_id
       WHERE e.employee_id = ?
       ORDER BY p.payroll_id DESC
       LIMIT 1`,
      [employeeId],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        error: `No payroll record found for employee ${employeeId}`,
      });
    }

    const record = rows[0];
    const payslip = computePayroll(
      record.hours_worked,
      record.leave_deductions,
      record.final_salary,
    );

    res.status(200).json({ success: true, employee: record, payslip });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payroll
 * Handles the "Custom Payroll Calculator" form on payroll.html.
 * Employee IDs 1-10 are reserved/seeded, so this always targets a NEW
 * employee (id >= 11). Creates the employee row (if it doesn't already
 * exist) and the payroll row inside a single transaction, so a failure
 * never leaves an orphaned employee with no payroll record, or vice versa.
 */
async function createCustomPayslip(req, res, next) {
  const {
    empId,
    empName,
    empPosition,
    empDept,
    payPdStrt,
    payPdEnd,
    hrsWorked,
    leaveDeduct,
    finSal,
  } = req.body;

  // --- server-side validation (mirrors the client-side checks in payroll.js) ---
  const employeeId = Number(empId);
  const hoursWorked = Number(hrsWorked);
  const leaveDeductions = Number(leaveDeduct ?? 0);
  const finalSalary = Number(finSal);

  const errors = [];
  if (!Number.isInteger(employeeId) || employeeId < 11) {
    errors.push(
      "empId must be an integer of 11 or higher (IDs 1-10 are reserved).",
    );
  }
  if (!empName || typeof empName !== "string" || !empName.trim()) {
    errors.push("empName is required.");
  }
  if (!empPosition || typeof empPosition !== "string" || !empPosition.trim()) {
    errors.push("empPosition is required.");
  }
  if (!empDept || typeof empDept !== "string" || !empDept.trim()) {
    errors.push("empDept is required.");
  }
  if (!payPdStrt || !payPdEnd || !isValidCalendarMonth(payPdStrt, payPdEnd)) {
    errors.push(
      "payPdStrt/payPdEnd must form one full calendar month (start = 1st, end = last day, same month/year).",
    );
  }
  if (!Number.isFinite(hoursWorked) || hoursWorked <= 0) {
    errors.push("hrsWorked must be a positive number.");
  }
  if (!Number.isFinite(leaveDeductions) || leaveDeductions < 0) {
    errors.push("leaveDeduct must be zero or a positive number.");
  }
  if (leaveDeductions >= hoursWorked) {
    errors.push("leaveDeduct must be less than hrsWorked.");
  }
  if (!Number.isFinite(finalSalary) || finalSalary < 0) {
    errors.push("finSal must be zero or a positive number.");
  }

  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  // Validate position and department against database options
  try {
    const [positionRows] = await pool.query(
      `SELECT DISTINCT position FROM employees WHERE position IS NOT NULL AND position != '' ORDER BY position`,
    );
    const [departmentRows] = await pool.query(
      `SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '' ORDER BY department`,
    );

    const validPositions = positionRows.map((p) => p.position);
    const validDepartments = departmentRows.map((d) => d.department);

    // Position must be in the valid list
    if (!validPositions.includes(empPosition.trim())) {
      return res.status(400).json({
        success: false,
        errors: [
          `Invalid Employee Position. Must be one of: ${validPositions.join(", ")}`,
        ],
      });
    }

    // Department must be in the valid list
    if (!validDepartments.includes(empDept.trim())) {
      return res.status(400).json({
        success: false,
        errors: [
          `Invalid Employee Department. Must be one of: ${validDepartments.join(", ")}`,
        ],
      });
    }
  } catch (err) {
    next(err);
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      "SELECT employee_id FROM employees WHERE employee_id = ? FOR UPDATE",
      [employeeId],
    );

    if (!existing.length) {
      // `contact` is NOT NULL UNIQUE in the schema, but the calculator form
      // doesn't collect one — generate a placeholder unique per employeeId.
      await conn.query(
        `INSERT INTO employees (employee_id, name, position, department, salary, contact)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          empName.trim(),
          (empPosition || "").trim() || null,
          (empDept || "").trim() || null,
          finalSalary,
          `custom-emp-${employeeId}@moderntech.internal`,
        ],
      );
    }

    const [result] = await conn.query(
      `INSERT INTO payroll (employee_id, pay_period_start, pay_period_end, hours_worked, leave_deductions, final_salary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        payPdStrt,
        payPdEnd,
        hoursWorked,
        leaveDeductions,
        finalSalary,
      ],
    );

    await conn.commit();

    const payslip = computePayroll(hoursWorked, leaveDeductions, finalSalary);
    res.status(201).json({
      success: true,
      payrollId: result.insertId,
      employee: {
        employeeId,
        employeeName: empName.trim(),
        employeePosition: empPosition || null,
        employeeDepartment: empDept || null,
      },
      payPeriodStart: payPdStrt,
      payPeriodEnd: payPdEnd,
      hoursWorked,
      leaveDeductions,
      finalSalary,
      payslip,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/**
 * Get unique positions and departments from employees table
 * Used to populate dropdown options in the custom payroll calculator
 */
async function getPositionsDepartments(req, res, next) {
  try {
    const [positions] = await pool.query(
      `SELECT DISTINCT position FROM employees WHERE position IS NOT NULL AND position != '' ORDER BY position`,
    );
    const [departments] = await pool.query(
      `SELECT DISTINCT department FROM employees WHERE department IS NOT NULL AND department != '' ORDER BY department`,
    );

    const positionList = positions.map((p) => p.position).filter(Boolean);
    const departmentList = departments.map((d) => d.department).filter(Boolean);

    res.json({
      success: true,
      positions: positionList,
      departments: departmentList,
    });
  } catch (err) {
    next(err);
  }
}

export {
  computePayroll,
  isValidCalendarMonth,
  getAllPayroll,
  getPayrollByEmployee,
  createCustomPayslip,
  getPositionsDepartments,
};
