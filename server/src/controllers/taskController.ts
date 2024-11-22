import { Request, Response } from "express";
import Task from "../models/Task";
import asyncHandler from "express-async-handler";

// Get all tasks for a specific user
export const getTasksByUserId = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const tasks = await Task.find({ userId }).sort({
      priority: -1,
      dueDate: 1,
    }); // Sort by priority (desc) and due date (asc)

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this user" });
    }

    res.json(tasks);
  }
);

// Get all tasks with sorting by priority and dueDate
export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await Task.find().sort({ priority: -1, dueDate: 1 }); // -1 for descending priority, 1 for ascending dueDate
  res.json(tasks);
});

// Create a new task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const taskData = {
    ...req.body,
    userId: (req as any).user.id,
  };
  const task = await Task.create(taskData);
  res.status(201).json(task);
});

// Get a specific task by ID
export const getTaskById = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  }
);

// Update a task by ID
export const updateTask = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  }
);

// Delete a task by ID
export const deleteTask = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  }
);

// Mark a task as completed
export const markTaskAsCompleted = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  }
);
