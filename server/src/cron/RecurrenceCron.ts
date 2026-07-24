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

// Run once on server startup after a delay to avoid memory spikes during init
const INITIAL_DELAY_MS = 120_000; // 2 minutes — give server time to settle
let startupTimer: ReturnType<typeof setTimeout> | null = setTimeout(async () => {
  startupTimer = null;
  console.log("[RecurrenceCron] Running initial recurrence check...");
  try {
    await recurrenceService.processRecurringTasks();
  } catch (error) {
    console.error("[RecurrenceCron] Initial run error:", error);
  }
}, INITIAL_DELAY_MS);

export default recurrenceCron;
