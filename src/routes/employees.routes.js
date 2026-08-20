import express from "express";
import auth from "../middleware/auth.js";
import { getMyEmployeeProfile } from "../controllers/employeeController.js";
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from "../controllers/employeesController.js";

const router = express.Router();

router.get("/me", auth, getMyEmployeeProfile);
router.get("/", auth, listEmployees);
router.post("/", auth, createEmployee);
router.put("/:employeeId", auth, updateEmployee);
router.delete("/:employeeId", auth, deleteEmployee);

export default router;
