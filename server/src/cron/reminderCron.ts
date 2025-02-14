import cron from "node-cron";
import Task from "../models/Task";
import { sendPushNotification } from "../utils/notificationUtils";
import nodemailer from "nodemailer";
import { addMinutes } from "date-fns";

// Configure Nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // For example, using Gmail SMTP
  auth: {
    // user: process.env.EMAIL_USER, //  email address
    // pass: process.env.EMAIL_PASS, // email password or app-specific password
    user: "anyimworkspace@gmail.com",
    pass: "otia aovt ujqx gins",
  },
});

// Test the connection when your server starts
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email server error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Utility function to send email notifications
const sendEmailNotification = async (
  email: string,
  subject: string,
  text: string
): Promise<boolean> => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to: email,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    console.log(email);
    return false;
  }
};

const processTaskNotification = async (
  task: any,
  user: any
): Promise<boolean> => {
  try {
    let notificationSent = false;

    // Send push notification if FCM token exists
    if (user.fcmToken) {
      try {
        const title = "Task Reminder";
        const message = `Reminder: "${task.title}" is due ${task.dueTime}`;
        await sendPushNotification(user.fcmToken, title, message, {
          taskId: task._id.toString(),
          dueDate: task.dueDate.toString(),
        });
        notificationSent = true;
        console.log(`Push notification sent for task "${task.title}"`);
      } catch (error) {
        console.error(`Push notification failed for task ${task._id}:`, error);
      }
    }

    // Send email notification
    const emailSubject = `Task Reminder: ${task.title}`;
    const emailText = `Hello ${user.username},

Your task "${task.title}" is due soon!

Task Details:
- Due: ${new Date(task.dueDate).toLocaleString()}
- Priority: ${task.priority}
${task.description ? `- Description: ${task.description}` : ""}

Please complete this task on time.

Best regards,
Your Task Manager`;

    const emailSent = await sendEmailNotification(
      user.email,
      emailSubject,
      emailText
    );

    return notificationSent || emailSent;
  } catch (error) {
    console.error(
      `Error processing notifications for task ${task._id}:`,
      error
    );
    return false;
  }
};

// Cron job: Checks every minute for tasks nearing reminder time
cron.schedule("* * * * *", async () => {
  console.log("Running reminder check:", new Date().toISOString());

  const currentTime = new Date();
  const lookAheadTime = addMinutes(currentTime, 15); // Look ahead 15 minutes

  try {
    // Find relevant tasks
    const tasks = await Task.find({
      reminderTime: {
        $gte: currentTime,
        $lt: lookAheadTime,
      },
      completed: false,
      notificationSent: false, // Only get tasks that haven't been notified
    }).populate("userId"); // Populate user data directly

    if (tasks.length > 0) {
      console.log(`Found ${tasks.length} tasks requiring notifications`);
    }

    for (const task of tasks) {
      try {
        const user = task.userId;
        if (!user) {
          console.warn(`No user found for task ${task._id}`);
          continue;
        }

        // Process notifications
        const notificationSuccess = await processTaskNotification(task, user);

        if (notificationSuccess) {
          // Mark notification as sent only if at least one notification method succeeded
          await Task.findByIdAndUpdate(task._id, {
            notificationSent: true,
          });
        }
      } catch (taskError) {
        console.error(`Error processing task ${task._id}:`, taskError);
        // Continue with next task instead of breaking the entire loop
        continue;
      }
    }
  } catch (error) {
    console.error("Error in reminder cron job:", error);
  }
});
