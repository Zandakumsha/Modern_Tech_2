import pool from "../config/db.js";

function isHR(req) {
  return req.user?.role === "Admin" || req.user?.role === "Manager";
}

function normalize(body = {}) {
  return {
    name: String(body.name || "").trim(),
    contact: String(body.contact || "").trim(),
    position: String(body.position || "").trim(),
    department: String(body.department || "").trim(),
    employmentHistory: String(body.employmentHistory || "").trim(),
    salary: Number(body.salary),
  };
}

export async function listEmployees(req, res) {
  try {
    const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact FROM employees ORDER BY employee_id`);
    res.json({ employees: rows });
  } catch (error) {
    console.error("Employee list failed:", error);
    res.status(500).json({ message: "Unable to load employees", error: error.message });
  }
}

export async function createEmployee(req, res) {
  if (!isHR(req)) return res.status(403).json({ message: "Only Admin or Manager users can manage employees" });
  const employee = normalize(req.body);
  if (!employee.name || !employee.contact || !employee.position || !employee.department || !Number.isFinite(employee.salary) || employee.salary <= 0) return res.status(400).json({ message: "Name, contact, position, department and a valid salary are required" });
  try {
    const [result] = await pool.query(`INSERT INTO employees (name, position, department, salary, employment_history, contact) VALUES (?, ?, ?, ?, ?, ?)`, [employee.name, employee.position, employee.department, employee.salary, employee.employmentHistory, employee.contact]);
    const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact FROM employees WHERE employee_id = ?`, [result.insertId]);
    res.status(201).json({ employee: rows[0] });
  } catch (error) {
    console.error("Employee create failed:", error);
    res.status(500).json({ message: "Unable to create employee", error: error.message });
  }
}

export async function updateEmployee(req, res) {
  if (!isHR(req)) return res.status(403).json({ message: "Only Admin or Manager users can manage employees" });
  const employeeId = Number(req.params.employeeId);
  const employee = normalize(req.body);
  if (!Number.isInteger(employeeId) || employeeId <= 0) return res.status(400).json({ message: "Invalid employee ID" });
  if (!employee.name || !employee.contact || !employee.position || !employee.department || !Number.isFinite(employee.salary) || employee.salary <= 0) return res.status(400).json({ message: "Name, contact, position, department and a valid salary are required" });
  try {
    const [result] = await pool.query(`UPDATE employees SET name = ?, position = ?, department = ?, salary = ?, employment_history = ?, contact = ? WHERE employee_id = ?`, [employee.name, employee.position, employee.department, employee.salary, employee.employmentHistory, employee.contact, employeeId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Employee not found" });
    const [rows] = await pool.query(`SELECT employee_id AS employeeId, name, position, department, salary, employment_history AS employmentHistory, contact FROM employees WHERE employee_id = ?`, [employeeId]);
    res.json({ employee: rows[0] });
  } catch (error) {
    console.error("Employee update failed:", error);
    res.status(500).json({ message: "Unable to update employee", error: error.message });
  }
}

export async function deleteEmployee(req, res) {
  if (!isHR(req)) return res.status(403).json({ message: "Only Admin or Manager users can manage employees" });
  const employeeId = Number(req.params.employeeId);
  if (!Number.isInteger(employeeId) || employeeId <= 0) return res.status(400).json({ message: "Invalid employee ID" });
  try {
    const [result] = await pool.query("DELETE FROM employees WHERE employee_id = ?", [employeeId]);
    if (!result.affectedRows) return res.status(404).json({ message: "Employee not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Employee delete failed:", error);
    res.status(409).json({ message: "Unable to delete employee. Remove related records first if required by the database.", error: error.message });
  }
}
