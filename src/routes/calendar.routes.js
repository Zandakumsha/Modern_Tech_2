import { Router } from "express";
import { createEvent, deleteEvent, listEvents } from "../controllers/calendarController.js";

const router = Router();

// Calendar uses MySQL directly and deliberately does not require JWT/token authentication.
router.get("/", listEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

export default router;
