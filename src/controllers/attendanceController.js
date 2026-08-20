import pool from "../config/db.js";

function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function isValidDate(value) {
  if (!value || typeof value !== "string") return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isAdminOrManager(req) {
  return req.user?.role === "Admin" || req.user?.role === "Manager";
}

function canAccessEmployee(req, employeeId) {
  return isAdminOrManager(req) || Number(req.user?.employeeId) === Number(employeeId);
}

export async function getAttendance(req, res) {
  try {
    const [employees] = await pool.query(`SELECT employee_id AS employeeId, name, position, department FROM employees ORDER BY employee_id`);
    const [attendance] = await pool.query(`SELECT attendance_id AS attendanceId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, status FROM attendance ORDER BY date DESC`);
    const [leaveRequests] = await pool.query(`SELECT request_id AS requestId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, reason, status, created_at AS createdAt, decided_at AS decidedAt FROM leave_requests ORDER BY date DESC`);

    res.json({
      attendanceAndLeave: employees.map((employee) => ({
        ...employee,
        attendance: attendance.filter((row) => Number(row.employeeId) === Number(employee.employeeId)),
        leaveRequests: leaveRequests.filter((row) => Number(row.employeeId) === Number(employee.employeeId)),
      })),
    });
  } catch (error) {
    console.error("Error retrieving attendance:", error);
    res.status(500).json({ message: "Error retrieving attendance data", error: error.message });
  }
}

export async function getEmployeeAttendance(req, res) {
  const employeeId = parsePositiveInt(req.params.employeeId);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });
  if (!canAccessEmployee(req, employeeId)) return res.status(403).json({ message: "You can only view your own attendance" });

  try {
    const [employees] = await pool.query(`SELECT employee_id AS employeeId, name, position, department FROM employees WHERE employee_id = ?`, [employeeId]);
    if (!employees.length) return res.status(404).json({ message: "Employee not found" });
    const [attendance] = await pool.query(`SELECT attendance_id AS attendanceId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, status FROM attendance WHERE employee_id = ? ORDER BY date DESC`, [employeeId]);
    const [leaveRequests] = await pool.query(`SELECT request_id AS requestId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, reason, status, created_at AS createdAt, decided_at AS decidedAt FROM leave_requests WHERE employee_id = ? ORDER BY date DESC`, [employeeId]);
    res.json({ employee: employees[0], attendance, leaveRequests });
  } catch (error) {
    console.error("Error retrieving employee attendance:", error);
    res.status(500).json({ message: "Error retrieving employee attendance", error: error.message });
  }
}

export async function createAttendance(req, res) {
  if (!isAdminOrManager(req)) return res.status(403).json({ message: "Only Admin or Manager users can record attendance" });
  const employeeId = parsePositiveInt(req.body?.employeeId);
  const { date, status } = req.body || {};
  if (!employeeId || !isValidDate(date) || !["Present", "Absent"].includes(status)) return res.status(400).json({ message: "employeeId, date (YYYY-MM-DD), and status (Present or Absent) are required" });

  try {
    const [employee] = await pool.query("SELECT employee_id FROM employees WHERE employee_id = ?", [employeeId]);
    if (!employee.length) return res.status(404).json({ message: "Employee not found" });
    await pool.query(`INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)`, [employeeId, date, status]);
    const [rows] = await pool.query(`SELECT attendance_id AS attendanceId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, status FROM attendance WHERE employee_id = ? AND date = ?`, [employeeId, date]);
    res.status(201).json({ message: "Attendance recorded successfully", attendance: rows[0] });
  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({ message: "Error recording attendance", error: error.message });
  }
}

export async function updateAttendance(req, res) {
  if (!isAdminOrManager(req)) return res.status(403).json({ message: "Only Admin or Manager users can update attendance" });
  const attendanceId = parsePositiveInt(req.params.attendanceId);
  const { date, status } = req.body || {};
  if (!attendanceId || !isValidDate(date) || !["Present", "Absent"].includes(status)) return res.status(400).json({ message: "attendanceId, date (YYYY-MM-DD), and status (Present or Absent) are required" });

  try {
    const [result] = await pool.query("UPDATE attendance SET date = ?, status = ? WHERE attendance_id = ?", [date, status, attendanceId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Attendance record not found" });
    const [rows] = await pool.query(`SELECT attendance_id AS attendanceId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, status FROM attendance WHERE attendance_id = ?`, [attendanceId]);
    res.json({ message: "Attendance updated successfully", attendance: rows[0] });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Error updating attendance", error: error.message });
  }
}

export async function deleteAttendance(req, res) {
  if (!isAdminOrManager(req)) return res.status(403).json({ message: "Only Admin or Manager users can delete attendance" });
  const attendanceId = parsePositiveInt(req.params.attendanceId);
  if (!attendanceId) return res.status(400).json({ message: "Invalid attendance ID" });
  try {
    const [result] = await pool.query("DELETE FROM attendance WHERE attendance_id = ?", [attendanceId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Attendance record not found" });
    res.json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Error deleting attendance", error: error.message });
  }
}

export async function getLeaveRequests(req, res) {
  try {
    const [rows] = await pool.query(`SELECT lr.request_id AS requestId, lr.employee_id AS employeeId, e.name, e.position, e.department, DATE_FORMAT(lr.date, '%Y-%m-%d') AS date, lr.reason, lr.status, lr.created_at AS createdAt, lr.decided_at AS decidedAt FROM leave_requests lr JOIN employees e ON e.employee_id = lr.employee_id ORDER BY lr.date DESC`);
    res.json(rows);
  } catch (error) {
    console.error("Error retrieving leave requests:", error);
    res.status(500).json({ message: "Error retrieving leave requests", error: error.message });
  }
}

export async function createLeaveRequest(req, res) {
  const employeeId = parsePositiveInt(req.body?.employeeId) || parsePositiveInt(req.user?.employeeId);
  const { date, startDate, endDate, type, reason } = req.body || {};
  const requestReason = String(type || reason || "").trim();
  if (!employeeId || !requestReason) return res.status(400).json({ message: "employeeId and leave reason/type are required" });

  // The employee is selected by the person submitting the request. A logged-in
  // user does not have to be that employee. This allows an Admin/Manager (and,
  // where the UI permits it, another authenticated user) to submit a leave
  // request on behalf of a selected employee.
  try {
    const [employee] = await pool.query("SELECT employee_id FROM employees WHERE employee_id = ?", [employeeId]);
    if (!employee.length) return res.status(404).json({ message: "Employee not found" });

    const dates = [];
    if (date) {
      if (!isValidDate(date)) return res.status(400).json({ message: "date must be YYYY-MM-DD" });
      dates.push(date);
    } else {
      if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) return res.status(400).json({ message: "Valid startDate and endDate are required" });
      const current = new Date(`${startDate}T00:00:00Z`);
      const last = new Date(`${endDate}T00:00:00Z`);
      while (current <= last) {
        dates.push(current.toISOString().slice(0, 10));
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const requests = [];
      for (const requestedDate of dates) {
        const [result] = await connection.query(`INSERT INTO leave_requests (employee_id, date, reason, status) VALUES (?, ?, ?, 'Pending')`, [employeeId, requestedDate, requestReason]);
        requests.push({ requestId: result.insertId, employeeId, date: requestedDate, reason: requestReason, status: "Pending" });
      }
      await connection.commit();
      res.status(201).json({ message: "Leave request created successfully", requests });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ message: "Error creating leave request", error: error.message });
  }
}

export async function updateLeaveRequestStatus(req, res) {
  if (!isAdminOrManager(req)) return res.status(403).json({ message: "Only Admin or Manager users can approve or deny leave" });
  const requestId = parsePositiveInt(req.params.requestId);
  const { status } = req.body || {};
  if (!requestId || !["Pending", "Approved", "Denied"].includes(status)) return res.status(400).json({ message: "Valid requestId and status are required" });
  try {
    const [result] = await pool.query(`UPDATE leave_requests SET status = ?, decided_at = CASE WHEN ? = 'Pending' THEN NULL ELSE CURRENT_TIMESTAMP END WHERE request_id = ?`, [status, status, requestId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Leave request not found" });
    const [rows] = await pool.query(`SELECT request_id AS requestId, employee_id AS employeeId, DATE_FORMAT(date, '%Y-%m-%d') AS date, reason, status, created_at AS createdAt, decided_at AS decidedAt FROM leave_requests WHERE request_id = ?`, [requestId]);
    res.json({ message: "Leave request updated successfully", request: rows[0] });
  } catch (error) {
    console.error("Error updating leave request:", error);
    res.status(500).json({ message: "Error updating leave request", error: error.message });
  }
}

export async function deleteLeaveRequest(req, res) {
  const requestId = parsePositiveInt(req.params.requestId);
  if (!requestId) return res.status(400).json({ message: "Invalid leave request ID" });
  try {
    const [existing] = await pool.query("SELECT employee_id FROM leave_requests WHERE request_id = ?", [requestId]);
    if (!existing.length) return res.status(404).json({ message: "Leave request not found" });
    if (!canAccessEmployee(req, existing[0].employee_id)) return res.status(403).json({ message: "You can only delete your own leave request" });
    await pool.query("DELETE FROM leave_requests WHERE request_id = ?", [requestId]);
    res.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({ message: "Error deleting leave request", error: error.message });
  }
}
