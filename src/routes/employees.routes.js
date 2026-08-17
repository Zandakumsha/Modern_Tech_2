import express from "express";
import auth from "../middleware/auth.js";
import {
  listEmployees,
  getEmployee,
  getEmployeeForCurrentUser,
  createEmployeeHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
  getPayroll,
  getAttendance,
  getLeave,
  requestLeave,
  getSummary,
} from "../controllers/employeeController.js";

const router = express.Router();

// The signed-in employee's profile is resolved from the JWT, not a URL ID/email.
router.get("/me", auth, getEmployeeForCurrentUser);
router.get("/", listEmployees);
router.post("/", createEmployeeHandler);
router.get("/:id", getEmployee);
router.put("/:id", auth, updateEmployeeHandler);
router.delete("/:id", deleteEmployeeHandler);
router.get("/:id/summary", auth, getSummary);
router.get("/:id/payroll", auth, getPayroll);
router.get("/:id/attendance", auth, getAttendance);
router.get("/:id/leave", auth, getLeave);
router.post("/:id/leave", auth, requestLeave);

export default router;
