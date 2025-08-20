import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/Task";
import User from "../models/User";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });

function computeUserHabitMetrics(tasks: any[]) {
  // Calculate metrics for user habits
  const completedTasks = tasks.filter((t) => t.completed);
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? completedTasks.length / totalTasks : 0;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && new Date(t.dueDate) < new Date()
  );
  const overdueRate = totalTasks > 0 ? overdueTasks.length / totalTasks : 0;
  const streak = computeCompletionStreak(completedTasks);
  const mostProductiveHour = getMostProductiveHour(completedTasks);
  return {
    completionRate,
    overdueRate,
    streak,
    mostProductiveHour,
    totalTasks,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
  };
}

function computeCompletionStreak(completedTasks: any[]) {
  // Calculate the current streak of days with at least one completed task
  const dates = completedTasks
    .map((t) => new Date(t.updatedAt).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // unique days
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streak = 0;
  let current = new Date();
  for (let i = 0; i < dates.length; i++) {
    if (new Date(dates[i]).toDateString() === current.toDateString()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getMostProductiveHour(completedTasks: any[]) {
  // Find the hour of day with most completed tasks
  const hours = Array(24).fill(0);
  completedTasks.forEach((t) => {
    const hour = new Date(t.updatedAt).getHours();
    hours[hour]++;
  });
  const max = Math.max(...hours);
  return hours.findIndex((h) => h === max);
}

export async function generateAIPoweredUserInsights(userId: string) {
  const user = await User.findById(userId);
  const tasks = await Task.find({ userId });
  const habitMetrics = computeUserHabitMetrics(tasks);
  const prompt = `You are Taskwise, an advanced productivity assistant. Analyze the following user's task data and habit metrics, and provide:
1. A personalized productivity insight based on their habits (e.g., best time of day, completion streak, etc.)
2. A task optimization suggestion (e.g., how to improve completion, break bad habits, etc.)
3. A habit-based suggestion (e.g., "Try to complete tasks earlier in the day", "Maintain your current streak!", etc.)
Return ONLY a JSON object:
{
  "productivityInsight": "...",
  "taskOptimization": "...",
  "habitSuggestion": "..."
}
User: ${user?.username || "User"}
Metrics: ${JSON.stringify(habitMetrics, null, 2)}
Tasks: ${JSON.stringify(
    tasks.map((t) => ({
      title: t.title,
      completed: t.completed,
      dueDate: t.dueDate,
      updatedAt: t.updatedAt,
      priority: t.priority,
      status: t.status,
    })),
    null,
    2
  )}
`;

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 400,
      temperature: 0.7,
      topP: 0.95,
    },
  });

  const output = response.response.text();
  try {
    return JSON.parse(output.trim());
  } catch {
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd >= 0) {
      return JSON.parse(output.substring(jsonStart, jsonEnd + 1));
    }
    throw new Error("Failed to parse Gemini insight response");
  }
}
