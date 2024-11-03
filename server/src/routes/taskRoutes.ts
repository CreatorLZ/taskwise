import { Router } from "express";
import {
  getAllTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
} from "../controllers/taskController"; // Import controller functions
import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

// routes linked to controller methods
router.get("/", authenticateUser, getAllTasks); // GET /api/tasks - Get all tasks
router.post("/", authenticateUser, createTask); // POST /api/tasks - Create a new task
router.get("/:id", authenticateUser, getTaskById); //GET task by id
router.patch("/:id", authenticateUser, updateTask); // update task
router.delete("/:id", authenticateUser, deleteTask); // delete task
router.patch("/:id/complete", authenticateUser, markTaskAsCompleted); //mark task as completed

export default router;
