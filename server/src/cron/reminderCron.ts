// cron/reminderCron.ts
import cron from "node-cron";
import Task from "../models/Task";
import { sendPushNotification } from "../utils/notificationUtils";
import User from "../models/User"; // Assuming each task has an associated user

// Runs every minute; you can adjust the interval as needed
cron.schedule("* * * * *", async () => {
  console.log("Checking for tasks nearing reminder time...");

  const currentTime = new Date();
  const tenMinutesFromNow = new Date(currentTime.getTime() + 10 * 60000);

  // Find tasks that have a reminder set within the next 10 minutes
  const tasks = await Task.find({
    reminderTime: { $lte: tenMinutesFromNow, $gt: currentTime },
  });

  tasks.forEach(async (task) => {
    const user = await User.findById(task.userId); // Assuming each task has userId

    if (user?.fcmToken) {
      const message = `Reminder: ${task.title} is due soon!`;
      await sendPushNotification(user.fcmToken, message);
    }
  });
});
