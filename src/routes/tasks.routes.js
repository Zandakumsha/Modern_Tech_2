import { Router } from "express";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
} from "../controllers/tasksController.js";

const router = Router();

router.get("/", listTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/completion", toggleTask);
router.delete("/:id", deleteTask);

export default router;
