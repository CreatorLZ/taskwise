/**
 * Recurrence Cron Job - Runs daily to generate recurring task instances
 */

import cron from "node-cron";
import { recurrenceService } from "../services/recurrenceService";

// Run every day at 1:00 AM
const recurrenceCron = cron.schedule(
  "0 1 * * *",
  async () => {
    console.log("[RecurrenceCron] Starting daily recurrence processing...");

    try {
      const result = await recurrenceService.processRecurringTasks();
      console.log(
        `[RecurrenceCron] Completed: ${result.generated} tasks generated`
      );

      if (result.errors.length > 0) {
        console.error("[RecurrenceCron] Errors:", result.errors);
      }
    } catch (error) {
      console.error("[RecurrenceCron] Fatal error:", error);
    }
  },
  {
    timezone: "UTC",
  }
);

// Also run once on server startup after a delay
setTimeout(async () => {
  console.log("[RecurrenceCron] Running initial recurrence check...");
  try {
    await recurrenceService.processRecurringTasks();
  } catch (error) {
    console.error("[RecurrenceCron] Initial run error:", error);
  }
}, 30000); // 30 seconds after startup

export default recurrenceCron;
