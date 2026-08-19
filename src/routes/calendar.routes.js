import { Router } from "express";
import { createEvent, deleteEvent, listEvents } from "../controllers/calendarController.js";

const router = Router();

router.get("/", listEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

export default router;
