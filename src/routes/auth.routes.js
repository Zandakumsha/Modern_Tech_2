import express from "express";
import { login, me, provisionEmployee } from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import { requireHR } from "../middleware/roles.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", auth, me);
router.post("/employee/provision", auth, requireHR, provisionEmployee);

export default router;
