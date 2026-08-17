import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePayroll,
  getEmployeeAttendance,
  getEmployeeLeave,
  createLeaveRequest,
  getEmployeeSummary,
} from "../models/employeeModel.js";

function parseEmployeeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateEmployeePayload(body = {}) {
  const { name, position, department, salary, employmentHistory, contact } = body;
  const parsedSalary = Number(salary);

  if (!name?.trim() || !position?.trim() || !department?.trim() || !contact?.trim()) {
    return "name, position, department and contact are required";
  }

  if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
    return "salary must be a valid non-negative number";
  }

  return null;
}

export async function listEmployees(req, res) {
  try {
    const employees = await getAllEmployees();
    res.json(employees);
  } catch (error) {
    console.error("GET /api/employees failed:", error);
    res.status(500).json({ message: "Error retrieving employees", error: error.message });
  }
}

export async function getEmployee(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    console.error("GET employee failed:", error);
    res.status(500).json({ message: "Error retrieving employee", error: error.message });
  }
}

export async function createEmployeeHandler(req, res) {
  const validationError = validateEmployeePayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const employee = await createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error) {
    console.error("POST employee failed:", error);
    const status = error.code === "ER_DUP_ENTRY" ? 409 : 500;
    res.status(status).json({
      message: status === 409 ? "An employee with this contact already exists" : "Error creating employee",
      error: error.message,
    });
  }
}

export async function updateEmployeeHandler(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  const validationError = validateEmployeePayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const employee = await updateEmployee(employeeId, req.body);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    console.error("PUT employee failed:", error);
    const status = error.code === "ER_DUP_ENTRY" ? 409 : 500;
    res.status(status).json({
      message: status === 409 ? "An employee with this contact already exists" : "Error updating employee",
      error: error.message,
    });
  }
}

export async function deleteEmployeeHandler(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  try {
    const deleted = await deleteEmployee(employeeId);
    if (!deleted) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("DELETE employee failed:", error);
    res.status(500).json({ message: "Error deleting employee", error: error.message });
  }
}

export async function getPayroll(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(await getEmployeePayroll(employeeId));
  } catch (error) {
    console.error("GET payroll failed:", error);
    res.status(500).json({ message: "Error retrieving payroll", error: error.message });
  }
}

export async function getAttendance(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(await getEmployeeAttendance(employeeId));
  } catch (error) {
    console.error("GET attendance failed:", error);
    res.status(500).json({ message: "Error retrieving attendance", error: error.message });
  }
}

export async function getLeave(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(await getEmployeeLeave(employeeId));
  } catch (error) {
    console.error("GET leave failed:", error);
    res.status(500).json({ message: "Error retrieving leave requests", error: error.message });
  }
}

export async function requestLeave(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  const { date, reason } = req.body || {};
  if (!date || !reason?.trim()) {
    return res.status(400).json({ message: "date and reason are required" });
  }

  try {
    const employee = await getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const request = await createLeaveRequest(employeeId, { date, reason: reason.trim() });
    res.status(201).json(request);
  } catch (error) {
    console.error("POST leave request failed:", error);
    res.status(500).json({ message: "Error creating leave request", error: error.message });
  }
}

export async function getSummary(req, res) {
  const employeeId = parseEmployeeId(req.params.id);
  if (!employeeId) return res.status(400).json({ message: "Invalid employee ID" });

  try {
    const summary = await getEmployeeSummary(employeeId);
    if (!summary) return res.status(404).json({ message: "Employee not found" });
    res.json(summary);
  } catch (error) {
    console.error("GET summary failed:", error);
    res.status(500).json({ message: "Error retrieving employee summary", error: error.message });
  }
}
