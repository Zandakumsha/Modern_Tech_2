import {
  getAllEmployees,
  getEmployeeById,
  findEmployeeByContact,
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
  const { name, position, department, salary, contact } = body;
  if (!name?.trim() || !position?.trim() || !department?.trim() || !contact?.trim()) return "name, position, department and contact are required";
  if (!Number.isFinite(Number(salary)) || Number(salary) < 0) return "salary must be a valid non-negative number";
  return null;
}

export async function listEmployees(req, res) {
  try { res.json(await getAllEmployees()); }
  catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving employees", error: error.message }); }
}

export async function getEmployee(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try {
    const employee = await getEmployeeById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving employee", error: error.message }); }
}

export async function getEmployeeForCurrentUser(req, res) {
  try {
    if (req.user.employeeId) {
      const employee = await getEmployeeById(req.user.employeeId);
      if (!employee) return res.status(404).json({ message: "Linked employee profile not found" });
      return res.json(employee);
    }

    const employee = await findEmployeeByContact(req.user.email);
    if (!employee) return res.status(404).json({ message: "Your account is not linked to an employee profile" });
    res.json(employee);
  } catch (error) { console.error(error); res.status(500).json({ message: "Error resolving employee account", error: error.message }); }
}

export async function createEmployeeHandler(req, res) {
  const validationError = validateEmployeePayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  try { res.status(201).json(await createEmployee(req.body)); }
  catch (error) { console.error(error); res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "Username or email already exists" : "Error creating employee", error: error.message }); }
}

export async function updateEmployeeHandler(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  const validationError = validateEmployeePayload(req.body);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const employee = await updateEmployee(id, req.body);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) { console.error(error); res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ message: error.code === "ER_DUP_ENTRY" ? "An employee with this contact already exists" : "Error updating employee", error: error.message }); }
}

export async function deleteEmployeeHandler(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try {
    if (!(await deleteEmployee(id))) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) { console.error(error); res.status(500).json({ message: "Error deleting employee", error: error.message }); }
}

export async function getPayroll(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try { if (!(await getEmployeeById(id))) return res.status(404).json({ message: "Employee not found" }); res.json(await getEmployeePayroll(id)); }
  catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving payroll", error: error.message }); }
}

export async function getAttendance(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try { if (!(await getEmployeeById(id))) return res.status(404).json({ message: "Employee not found" }); res.json(await getEmployeeAttendance(id)); }
  catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving attendance", error: error.message }); }
}

export async function getLeave(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try { if (!(await getEmployeeById(id))) return res.status(404).json({ message: "Employee not found" }); res.json(await getEmployeeLeave(id)); }
  catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving leave requests", error: error.message }); }
}

export async function requestLeave(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  if (req.user?.employeeId && Number(req.user.employeeId) !== id) return res.status(403).json({ message: "You can only submit leave for your own employee account" });
  const { date, reason } = req.body || {};
  if (!date || !reason?.trim()) return res.status(400).json({ message: "date and reason are required" });
  try {
    if (!(await getEmployeeById(id))) return res.status(404).json({ message: "Employee not found" });
    res.status(201).json(await createLeaveRequest(id, { date, reason: reason.trim() }));
  } catch (error) { console.error(error); res.status(500).json({ message: "Error creating leave request", error: error.message }); }
}

export async function getSummary(req, res) {
  const id = parseEmployeeId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid employee ID" });
  try {
    const summary = await getEmployeeSummary(id);
    if (!summary) return res.status(404).json({ message: "Employee not found" });
    res.json(summary);
  } catch (error) { console.error(error); res.status(500).json({ message: "Error retrieving employee summary", error: error.message }); }
}
