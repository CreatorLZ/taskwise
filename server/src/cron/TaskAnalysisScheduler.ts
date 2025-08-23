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
    // Check if scheduling is already enabled in the database
    const user = await User.findById(userId);
    if (user?.taskAnalysisSchedule?.enabled) {
      // Scheduling already enabled, do not re-enable or re-run analysis
      return {
        firstRunTime: user.taskAnalysisSchedule.firstRunTime,
        secondRunTime: user.taskAnalysisSchedule.secondRunTime,
      };
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
    // Only schedule for users who have never enabled scheduling before (should be none on restart)
    // Do not re-run analysis for already enabled users
    // This function is now a no-op to prevent unnecessary Gemini requests
    return;
  }
}

// Create singleton instance
export const taskAnalysisScheduler = new TaskAnalysisScheduler();
