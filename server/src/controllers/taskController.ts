import { Request, Response } from "express";
import Task from "../models/Task";
import asyncHandler from "express-async-handler";
import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
  subMinutes,
} from "date-fns";
import calculateTimeProgress from "../utils/calculateTimeProgress";
import mongoose from "mongoose";

const calculateReminderTime = (dueDate: Date): Date => {
  return new Date(dueDate.getTime() - 10 * 60000);
};

const validateAndParseDate = (dateString: string): Date => {
  const parsedDate = parseISO(dateString);
  if (!isValid(parsedDate)) {
    throw new Error("Invalid date format provided");
  }
  return parsedDate;
};

// Get all tasks for a specific user with formatted dueTime
export const getTasksByUserId = asyncHandler(
  async (req: Request, res: Response): Promise<void | any> => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const tasks = await Task.find({ userId }).sort({
      createdAt: -1,
      priority: -1,
      dueDate: 1,
    });

    if (!tasks || tasks.length === 0) {
      return res.json({ message: "No tasks found for this user" });
    }

    const formattedTasks = tasks.map((task) => {
      const createdAt = task.createdAt ?? new Date();
      const progress = calculateTimeProgress(
        createdAt.toISOString(), // Use createdAt as startDate
        task.dueDate.toISOString()
      );

      return {
        ...task.toObject(),
        dueDate: task.dueDate.toISOString(),
        dueTime: formatDistanceToNow(new Date(task.dueDate), {
          addSuffix: true,
        }),
        formattedDueDate: format(new Date(task.dueDate), "MMM d, yyyy h:mm a"),
        startDate: format(new Date(createdAt), "yyyy-MM-dd"),
        progress,
      };
    });

    res.json(formattedTasks);
  }
);

// Get all tasks with sorting by priority and dueDate. this is a route for admins only . will update later
export const getAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await Task.find().sort({ priority: -1, dueDate: 1 }); // -1 for descending priority, 1 for ascending dueDate
  res.json(tasks);
});

//create a new task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const dueDate = new Date(req.body.dueDate);
  const reminderTime = calculateReminderTime(dueDate);

  const taskData = {
    ...req.body,
    userId: (req as any).user.id,
    dueDate: dueDate,
    reminderTime: reminderTime,
    notificationSent: false,
  };

  const task = await Task.create(taskData);
  const createdAt = task.createdAt ?? new Date();

  res.status(201).json({
    ...task.toObject(),
    dueDate: task.dueDate,
    dueTime: formatDistanceToNow(new Date(task.dueDate), {
      addSuffix: true,
    }),
    formattedDueDate: format(task.dueDate, "MMM d, yyyy h:mm a"),
    startDate: format(createdAt, "yyyy-MM-dd"),
    progress: calculateTimeProgress(
      createdAt.toISOString(),
      task.dueDate.toISOString()
    ),
  });
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
    let updates = { ...req.body };

    // If due date is being updated, recalculate reminder time
    if (req.body.dueDate) {
      const dueDate = validateAndParseDate(req.body.dueDate);
      updates = {
        ...updates,
        dueDate,
        reminderTime: calculateReminderTime(dueDate),
        // Reset notification flag when due date is updated
        notificationSent: false,
      };
    }
    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
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
    // Validate the task ID
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    // Find and update the task
    const task = await Task.findByIdAndUpdate(
      id,
      { completed: true, priority: "Completed" }, // Fields to update
      { new: true } // Return the updated document
    );

    // Handle task not found
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Send the updated task in the response
    res.json(task);
  }
);
