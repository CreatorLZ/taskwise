"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController"); // Import controller functions
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// routes linked to controller methods
router.get("/user/:userId", authMiddleware_1.authenticateUser, taskController_1.getTasksByUserId);
router.get("/", authMiddleware_1.authenticateUser, taskController_1.getAllTasks); // GET /api/tasks - Get all tasks
router.post("/", authMiddleware_1.authenticateUser, taskController_1.createTask); // POST /api/tasks - Create a new task
router.get("/:id", authMiddleware_1.authenticateUser, taskController_1.getTaskById); //GET task by id
router.patch("/:id", authMiddleware_1.authenticateUser, taskController_1.updateTask); // update task
router.delete("/:id", authMiddleware_1.authenticateUser, taskController_1.deleteTask); // delete task
router.patch("/:id/complete", authMiddleware_1.authenticateUser, taskController_1.markTaskAsCompleted); //mark task as completed
exports.default = router;
