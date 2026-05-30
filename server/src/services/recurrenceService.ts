/**
 * Recurrence Service - Handles recurring task generation
 */

import {
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import Task, { ITask } from "../models/Task";
import mongoose from "mongoose";

interface RecurrenceResult {
  generated: number;
  errors: string[];
}

class RecurrenceService {
  /**
   * Calculate the next occurrence date based on recurrence pattern
   */
  calculateNextOccurrence(
    currentDate: Date,
    pattern: string,
    interval: number,
    daysOfWeek?: number[]
  ): Date {
    switch (pattern) {
      case "daily":
        return addDays(currentDate, interval);

      case "weekly":
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Find next matching day of week
          let nextDate = addDays(currentDate, 1);
          for (let i = 0; i < 7; i++) {
            if (daysOfWeek.includes(nextDate.getDay())) {
              return nextDate;
            }
            nextDate = addDays(nextDate, 1);
          }
        }
        return addWeeks(currentDate, interval);

      case "monthly":
        return addMonths(currentDate, interval);

      case "custom":
        return addDays(currentDate, interval);

      default:
        return addDays(currentDate, 1);
    }
  }

  /**
   * Generate instances for a recurring task
   */
  async generateRecurringTaskInstance(
    parentTask: ITask,
    occurrenceDate: Date
  ): Promise<ITask | null> {
    try {
      // Create a new task instance based on the parent
      const taskData = {
        title: parentTask.title,
        description: parentTask.description,
        priority:
          parentTask.priority === "Completed" ? "Medium" : parentTask.priority,
        dueDate: occurrenceDate,
        userId: parentTask.userId,
        tags: parentTask.tags,
        category: parentTask.category,
        status: "Pending",
        completed: false,
        subtasks: parentTask.subtasks.map((s) => ({
          title: s.title,
          completed: false,
          order: s.order,
        })),
        timeTracking: {
          estimatedMinutes: parentTask.timeTracking?.estimatedMinutes,
          actualMinutes: 0,
          pomodoroSessions: 0,
        },
        parentTaskId: parentTask._id,
        isRecurrenceInstance: true,
        // Calculate reminder time (10 minutes before)
        reminderTime: new Date(occurrenceDate.getTime() - 10 * 60 * 1000),
      };

      const newTask = await Task.create(taskData);
      console.log(
        `[RecurrenceService] Created recurring instance for "${parentTask.title}"`
      );
      return newTask;
    } catch (error) {
      console.error(
        `[RecurrenceService] Error creating recurring instance:`,
        error
      );
      return null;
    }
  }

  /**
   * Process all recurring tasks and generate upcoming instances
   * Called by cron job daily
   */
  async processRecurringTasks(): Promise<RecurrenceResult> {
    const result: RecurrenceResult = { generated: 0, errors: [] };
    const now = new Date();
    const lookAhead = addDays(now, 7); // Generate tasks up to 7 days ahead

    try {
      // Find all tasks with enabled recurrence that need processing
      const recurringTasks = await Task.find({
        "recurrence.enabled": true,
        isRecurrenceInstance: { $ne: true }, // Only parent tasks
        $or: [
          { "recurrence.nextOccurrence": { $lte: lookAhead } },
          { "recurrence.nextOccurrence": { $exists: false } },
        ],
      });

      console.log(
        `[RecurrenceService] Found ${recurringTasks.length} recurring tasks to process`
      );

      for (const task of recurringTasks) {
        try {
          if (!task.recurrence) continue;

          // Check if past end date
          if (
            task.recurrence.endDate &&
            isAfter(now, task.recurrence.endDate)
          ) {
            // Disable recurrence
            task.recurrence.enabled = false;
            await task.save();
            continue;
          }

          // Calculate next occurrence if not set
          let nextOccurrence = task.recurrence.nextOccurrence;
          if (!nextOccurrence) {
            nextOccurrence = this.calculateNextOccurrence(
              task.dueDate,
              task.recurrence.pattern,
              task.recurrence.interval,
              task.recurrence.daysOfWeek
            );
            task.recurrence.nextOccurrence = nextOccurrence;
          }

          // Generate instances for any occurrences within the look-ahead window
          while (nextOccurrence && isBefore(nextOccurrence, lookAhead)) {
            // Check if we've already generated for this date
            const existingInstance = await Task.findOne({
              parentTaskId: task._id,
              dueDate: {
                $gte: startOfDay(nextOccurrence),
                $lt: addDays(startOfDay(nextOccurrence), 1),
              },
            });

            if (!existingInstance) {
              const instance = await this.generateRecurringTaskInstance(
                task,
                nextOccurrence
              );
              if (instance) {
                result.generated++;
              }
            }

            // Calculate next occurrence
            task.recurrence.lastGenerated = nextOccurrence;
            nextOccurrence = this.calculateNextOccurrence(
              nextOccurrence,
              task.recurrence.pattern,
              task.recurrence.interval,
              task.recurrence.daysOfWeek
            );
            task.recurrence.nextOccurrence = nextOccurrence;
          }

          await task.save();
        } catch (taskError: any) {
          result.errors.push(`Task ${task._id}: ${taskError.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Processing error: ${error.message}`);
    }

    console.log(
      `[RecurrenceService] Completed: ${result.generated} tasks generated, ${result.errors.length} errors`
    );
    return result;
  }

  /**
   * Set up recurrence for a task
   */
  async setupRecurrence(
    taskId: string,
    recurrenceConfig: {
      pattern: "daily" | "weekly" | "monthly" | "custom";
      interval: number;
      daysOfWeek?: number[];
      endDate?: Date;
    }
  ): Promise<ITask | null> {
    try {
      const task = await Task.findById(taskId);
      if (!task) return null;

      task.recurrence = {
        enabled: true,
        pattern: recurrenceConfig.pattern,
        interval: recurrenceConfig.interval,
        daysOfWeek: recurrenceConfig.daysOfWeek,
        endDate: recurrenceConfig.endDate,
        nextOccurrence: this.calculateNextOccurrence(
          task.dueDate,
          recurrenceConfig.pattern,
          recurrenceConfig.interval,
          recurrenceConfig.daysOfWeek
        ),
      };

      await task.save();
      return task;
    } catch (error) {
      console.error("[RecurrenceService] Error setting up recurrence:", error);
      return null;
    }
  }

  /**
   * Disable recurrence for a task
   */
  async disableRecurrence(taskId: string): Promise<boolean> {
    try {
      await Task.findByIdAndUpdate(taskId, {
        "recurrence.enabled": false,
      });
      return true;
    } catch (error) {
      console.error("[RecurrenceService] Error disabling recurrence:", error);
      return false;
    }
  }
}

export const recurrenceService = new RecurrenceService();
export default recurrenceService;
