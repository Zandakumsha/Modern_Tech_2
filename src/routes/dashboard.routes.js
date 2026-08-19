import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/dashboardController.js";

const router = Router();
router.get("/analytics", getDashboardAnalytics);

export default router;
