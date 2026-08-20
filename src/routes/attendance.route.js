import express from "express";
import auth from "../middleware/auth.js";

import {
  getAttendance,
  getEmployeeAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/", auth, getAttendance);
router.get("/employee/:employeeId", auth, getEmployeeAttendance);
router.post("/", auth, createAttendance);
router.put("/:attendanceId", auth, updateAttendance);
router.delete("/:attendanceId", auth, deleteAttendance);

router.get("/leave", auth, getLeaveRequests);
router.post("/leave", auth, createLeaveRequest);
router.patch("/leave/:requestId", auth, updateLeaveRequestStatus);
router.delete("/leave/:requestId", auth, deleteLeaveRequest);

export default router;
