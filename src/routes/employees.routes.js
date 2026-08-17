import express from "express";
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

router.get("/me", getEmployeeForCurrentUser);
router.get("/", listEmployees);
router.post("/", createEmployeeHandler);
router.get("/:id", getEmployee);
router.put("/:id", updateEmployeeHandler);
router.delete("/:id", deleteEmployeeHandler);
router.get("/:id/summary", getSummary);
router.get("/:id/payroll", getPayroll);
router.get("/:id/attendance", getAttendance);
router.get("/:id/leave", getLeave);
router.post("/:id/leave", requestLeave);

export default router;
