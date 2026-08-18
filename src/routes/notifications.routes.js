import { Router } from "express";
import auth from "../middleware/auth.js";
import { requireHR, requireEmployee } from "../middleware/roles.js";
import { getNotifications, createNotification, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationsController.js";

const router = Router();

router.get("/", auth, requireHR, getNotifications);
router.post("/", auth, requireEmployee, createNotification);
router.patch("/:id/read", auth, requireHR, markNotificationRead);
router.patch("/read-all", auth, requireHR, markAllNotificationsRead);

export default router;
