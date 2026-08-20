import { Router } from "express";
import auth from "../middleware/auth.js";
import { createEvent, deleteEvent, listEvents } from "../controllers/calendarController.js";

const router = Router();

router.use(auth);

router.get("/", listEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);

export default router;
