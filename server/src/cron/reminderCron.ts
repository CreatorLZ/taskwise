import cron from "node-cron";
import Task from "../models/Task";

import nodemailer from "nodemailer";
import { addMinutes } from "date-fns";
import { sendPushNotification } from "../utils/notificationUtils";

//  Nodemailer transport for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail as email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test the connection when server starts
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
  text: string,
  html: string
): Promise<boolean> => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to: email,
    subject: subject,
    text: text, // Plain text fallback
    html: html, // HTML version
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
        const message = `Reminder: "${
          task.title
        }" is due ${task.dueDate.toLocaleString()}`;
        await sendPushNotification(user.fcmToken, title, message, {
          taskId: task.id.toString(),
          dueDate: task.dueDate.toLocaleString(),
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
    // Prepare HTML email
    const priorityClass = task.priority.toLowerCase();

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskWise Reminder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background-color: #f5f7fb;
      margin: 0;
      padding: 0;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    
    /* Header styles */
    .header {
      background-color: #0f172a;
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
    }
    
    .logo-icon {
      width: 28px;
      height: 28px;
      margin-right: 10px;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.8;
      margin: 0;
    }
    
    /* Content styles */
    .content {
      padding: 30px 25px;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    
    .reminder {
      font-size: 16px;
      margin-bottom: 25px;
    }
    
    .task-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .task-title {
      font-size: 18px;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 15px;
    }
    
    .task-details {
      margin-bottom: 5px;
    }
    
    .label {
      font-weight: 600;
      color: #64748b;
    }
    
    .priority-badge {
      display: inline-block;
      background-color: #fecaca;
      color: #ef4444;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
    }
    
    .priority-badge.high {
      background-color: #fecaca;
      color: #ef4444;
    }
    
    .priority-badge.medium {
      background-color: #fed7aa;
      color: #f97316;
    }
    
    .priority-badge.low {
      background-color: #bfdbfe;
      color: #3b82f6;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #0f172a;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 10px;
    }
    
    /* Footer styles */
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-container">
        <!-- Brain icon from Lucide React -->
        <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z"></path>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z"></path>
        </svg>
        <h1 class="logo-text">TaskWise</h1>
      </div>
      <p class="subtitle">AI-Powered Tasks</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hello ${user.username},</p>
      
      <p class="reminder">Your task "${task.title}" is due soon!</p>
      
      <div class="task-card">
        <h2 class="task-title">${task.title}</h2>
        
        <p class="task-details">
          <span class="label">Due:</span> ${new Date(
            task.dueDate
          ).toLocaleString()}
        </p>
        
        <p class="task-details">
          <span class="label">Priority:</span> 
          <span class="priority-badge $<span class="priority-badge ${priorityClass}">${
      task.priority
    }</span>
        </p>
        
        ${
          task.description
            ? `
        <p class="task-details">
          <span class="label">Description:</span><br>
          ${task.description}
        </p>
        `
            : ""
        }
      </div>
      
      <p>Please complete this task on time to maintain your productivity.</p>
      
      <p>Our AI analysis shows you're most productive between 9 AM and 11 AM. Consider scheduling important tasks during this time.</p>
      
      <a href="${`https://taskwise-three.vercel.app/dashboard`}" class="cta-button">View Task</a>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} TaskWise. All rights reserved.</p>
      <p>This is an automated reminder from your TaskWise application.</p>
    </div>
  </div>
</body>
</html>`;

    const emailSent = await sendEmailNotification(
      user.email,
      emailSubject,
      emailText,
      emailHtml
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
