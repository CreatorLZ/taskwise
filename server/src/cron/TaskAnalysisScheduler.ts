import cron from "node-cron";

import User from "../models/User";
import { analyzeAndPrioritizeTasks } from "../utils/analyzeAndPrioritizeTasks";

interface ScheduleConfig {
  firstRunTime: string; // HH:mm format
  secondRunTime: string; // HH:mm format
  enabled: boolean;
}

export class TaskAnalysisScheduler {
  private schedules: Map<string, cron.ScheduledTask[]> = new Map();

  async enableSchedulingForUser(userId: string): Promise<any> {
    // Validate if scheduling already exists for this user
    if (this.schedules.has(userId)) {
      throw new Error("Scheduling already enabled for this user");
    }

    // Get current time and format it as HH:mm
    const now = new Date();
    const firstRunTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // Calculate second run time (12 hours later)
    const secondRunTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const secondRunTimeStr = `${String(secondRunTime.getHours()).padStart(
      2,
      "0"
    )}:${String(secondRunTime.getMinutes()).padStart(2, "0")}`;

    // Save schedule configuration to user model
    await User.findByIdAndUpdate(userId, {
      taskAnalysisSchedule: {
        firstRunTime,
        secondRunTime: secondRunTimeStr,
        enabled: true,
      },
    });

    // Create cron schedules
    const schedules = [
      cron.schedule(`${now.getMinutes()} ${now.getHours()} * * *`, () => {
        analyzeAndPrioritizeTasks(userId);
      }),
      cron.schedule(
        `${secondRunTime.getMinutes()} ${secondRunTime.getHours()} * * *`,
        () => {
          analyzeAndPrioritizeTasks(userId);
        }
      ),
    ];

    // Store schedules in memory
    this.schedules.set(userId, schedules);

    // Run initial analysis immediately
    await analyzeAndPrioritizeTasks(userId);

    return {
      firstRunTime,
      secondRunTime: secondRunTimeStr,
    };
  }

  async disableSchedulingForUser(userId: string): Promise<void> {
    const userSchedules = this.schedules.get(userId);
    if (userSchedules) {
      // Stop all schedules
      userSchedules.forEach((schedule) => schedule.stop());
      this.schedules.delete(userId);

      // Update user model
      await User.findByIdAndUpdate(userId, {
        "taskAnalysisSchedule.enabled": false,
      });
    }
  }

  async restoreSchedules(): Promise<void> {
    // Restore schedules from database on server restart
    const users = await User.find({
      "taskAnalysisSchedule.enabled": true,
    });

    for (const user of users) {
      const schedule = user.taskAnalysisSchedule;
      if (schedule && schedule.enabled) {
        await this.enableSchedulingForUser(user.id);
      }
    }
  }
}

// Create singleton instance
export const taskAnalysisScheduler = new TaskAnalysisScheduler();
