import { Router } from "express";
import { getSettings, updateCompany, updatePreferences } from "../controllers/settingsController.js";

const router = Router();

router.get("/", getSettings);
router.put("/company", updateCompany);
router.put("/preferences", updatePreferences);

export default router;
