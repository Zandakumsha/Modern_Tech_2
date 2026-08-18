import { Router } from "express";
import { getNotifications, createNotification, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationsController.js";

const router = Router();
router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);
export default router;
