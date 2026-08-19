import express from "express";
import auth from "../middleware/auth.js";
import { getMyEmployeeProfile } from "../controllers/employeeController.js";

const router = express.Router();

router.get("/me", auth, getMyEmployeeProfile);

export default router;
