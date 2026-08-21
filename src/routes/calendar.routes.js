import express from "express";
import auth from "../middleware/auth.js";
import { createEvent, deleteEvent, listEvents } from "../../controllers/calendarController.js";

const router = express.Router();
router.use(auth);
router.get("/", listEvents);
router.post("/", createEvent);
router.delete("/:id", deleteEvent);
export default router;
