// cron/reminderCron.ts
import cron from "node-cron";
import Task from "../models/Task";
import { sendPushNotification } from "../utils/notificationUtils";
import User from "../models/User"; // Assuming each task has an associated user

// Runs every minute; adjust the interval as needed
cron.schedule("* * * * *", async () => {
  console.log("Checking for tasks nearing reminder time...");

  const currentTime = new Date();
  const tenMinutesFromNow = new Date(currentTime.getTime() + 10 * 60000);

  try {
    // Find tasks with reminders set within the next 10 minutes
    const tasks = await Task.find({
      reminderTime: { $lte: tenMinutesFromNow, $gt: currentTime },
      completed: false,
    });

    for (const task of tasks) {
      try {
        // Fetch the associated user by userId
        const user = await User.findById(task.userId);

        if (user?.fcmToken) {
          const message = `Reminder: ${task.title} is due soon!`;
          await sendPushNotification(user.fcmToken, message);
          console.log(
            `Notification sent for task "${task.title}" to user ${user._id}`
          );
        } else {
          console.warn(`No FCM token found for user ${user?._id}`);
        }
      } catch (error) {
        console.error(`Error processing task ${task._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
});
