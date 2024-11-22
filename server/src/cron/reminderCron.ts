import cron from "node-cron";
import Task from "../models/Task";
import { sendPushNotification } from "../utils/notificationUtils";
import User from "../models/User";
import nodemailer from "nodemailer";

// Configure Nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // For example, using Gmail SMTP
  auth: {
    user: process.env.EMAIL_USER, //  email address
    pass: process.env.EMAIL_PASS, // email password or app-specific password
  },
});

// Utility function to send email notifications
const sendEmailNotification = async (
  email: string,
  subject: string,
  text: string
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};

// Cron job: Checks every minute for tasks nearing reminder time
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

        if (user) {
          // Send push notification if FCM token is available
          if (user.fcmToken) {
            const message = `Reminder: ${task.title} is due soon!`;
            await sendPushNotification(user.fcmToken, message);
            console.log(
              `Notification sent for task "${task.title}" to user ${user._id}`
            );
          } else {
            console.warn(`No FCM token found for user ${user._id}`);
          }

          // Send email notification
          const emailSubject = `Task Reminder: ${task.title}`;
          const emailText = `Hello ${user.username},\n\nJust a reminder that your task "${task.title}" is due soon!`;
          await sendEmailNotification(user.email, emailSubject, emailText);
        } else {
          console.warn(`User not found for task ${task._id}`);
        }
      } catch (error) {
        console.error(`Error processing task ${task._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
});
