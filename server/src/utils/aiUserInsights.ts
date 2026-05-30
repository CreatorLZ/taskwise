import { Types } from "mongoose";
import Task from "../models/Task";
import User from "../models/User";
import geminiService from "../services/geminiService";
import { AiJsonParseError, parseJsonObject } from "./aiJsonUtils";

interface TaskInsightInput {
  title: string;
  completed: boolean;
  dueDate: Date;
  updatedAt?: Date;
  priority: string;
  status: string;
  category?: string;
}

interface HabitMetrics {
  completionRate: number;
  overdueRate: number;
  streak: number;
  mostProductiveHour: number | null;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriorityOpenTasks: number;
}

export interface UserInsights {
  productivityInsight: string;
  taskOptimization: string;
  habitSuggestion: string;
  generatedBy: "ai" | "fallback";
}

function computeUserHabitMetrics(tasks: TaskInsightInput[]): HabitMetrics {
  const completedTasks = tasks.filter((task) => task.completed);
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(
    (task) => !task.completed && new Date(task.dueDate) < new Date()
  );
  const highPriorityOpenTasks = tasks.filter(
    (task) => !task.completed && task.priority === "High"
  ).length;

  return {
    completionRate:
      totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
    overdueRate:
      totalTasks > 0 ? Math.round((overdueTasks.length / totalTasks) * 100) : 0,
    streak: computeCompletionStreak(completedTasks),
    mostProductiveHour: getMostProductiveHour(completedTasks),
    totalTasks,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    highPriorityOpenTasks,
  };
}

function computeCompletionStreak(completedTasks: TaskInsightInput[]): number {
  const dates = [
    ...new Set(
      completedTasks
        .filter((task) => task.updatedAt)
        .map((task) => new Date(task.updatedAt as Date).toDateString())
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const current = new Date();

  for (const date of dates) {
    if (new Date(date).toDateString() === current.toDateString()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getMostProductiveHour(completedTasks: TaskInsightInput[]) {
  if (completedTasks.length === 0) return null;

  const hours = Array(24).fill(0);
  completedTasks.forEach((task) => {
    if (!task.updatedAt) return;
    const hour = new Date(task.updatedAt).getHours();
    hours[hour]++;
  });

  const max = Math.max(...hours);
  if (max === 0) return null;

  return hours.findIndex((hourCount) => hourCount === max);
}

function getFallbackInsights(metrics: HabitMetrics): UserInsights {
  if (metrics.totalTasks === 0) {
    return {
      productivityInsight:
        "You do not have enough task history yet. Create a few tasks and complete them to unlock better insights.",
      taskOptimization:
        "Start with one important task and give it a clear due date.",
      habitSuggestion:
        "Use a simple daily review to decide what deserves your attention first.",
      generatedBy: "fallback",
    };
  }

  const productiveHour =
    metrics.mostProductiveHour === null
      ? "your most consistent time"
      : `${String(metrics.mostProductiveHour).padStart(2, "0")}:00`;

  return {
    productivityInsight: `Your completion rate is ${metrics.completionRate}%, with ${metrics.overdueTasks} overdue task(s).`,
    taskOptimization:
      metrics.highPriorityOpenTasks > 3
        ? "Reduce the number of high-priority open tasks by choosing the top one or two for today."
        : "Keep priority focused and review due dates before adding more tasks.",
    habitSuggestion:
      metrics.streak > 0
        ? `You have a ${metrics.streak}-day completion streak. Protect it by finishing one small task around ${productiveHour}.`
        : "Build momentum by completing one small task today before starting a larger one.",
    generatedBy: "fallback",
  };
}

function validateInsights(value: Partial<UserInsights>): UserInsights | null {
  if (
    typeof value.productivityInsight !== "string" ||
    typeof value.taskOptimization !== "string" ||
    typeof value.habitSuggestion !== "string"
  ) {
    return null;
  }

  return {
    productivityInsight: value.productivityInsight,
    taskOptimization: value.taskOptimization,
    habitSuggestion: value.habitSuggestion,
    generatedBy: "ai",
  };
}

export async function generateAIPoweredUserInsights(
  userId: string
): Promise<UserInsights> {
  const user = await User.findById(userId).select("username");

  const tasks = await Task.find({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select("title completed dueDate updatedAt priority status category");

  const insightTasks = tasks.map((task) => ({
    title: task.title,
    completed: task.completed,
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
    priority: task.priority,
    status: task.status,
    category: task.category,
  }));
  const habitMetrics = computeUserHabitMetrics(insightTasks);
  const fallbackInsights = getFallbackInsights(habitMetrics);

  const prompt = `Return a JSON object only. No markdown. No prose.

Generate concise productivity insights from this user's task metrics.

Required shape:
{
  "productivityInsight": "one sentence grounded in the metrics",
  "taskOptimization": "one specific task-management suggestion",
  "habitSuggestion": "one habit suggestion the user can apply today"
}

User: ${user?.username || "User"}
Metrics: ${JSON.stringify(habitMetrics)}
Recent tasks: ${JSON.stringify(insightTasks.slice(0, 10))}`;

  try {
    const response = await geminiService.generateContent(
      prompt,
      {
        maxOutputTokens: 2048,
        temperature: 0,
        topP: 0.9,
        responseMimeType: "application/json",
        thinkingLevel: "low",
      },
      12000
    );

    const parsed = parseJsonObject<Partial<UserInsights>>(response);
    return validateInsights(parsed) || fallbackInsights;
  } catch (error: any) {
    if (error instanceof AiJsonParseError) {
      console.warn("[AI insights] Invalid JSON response from Gemini", {
        message: error.message,
        responsePreview: error.responsePreview,
      });
    }

    console.warn(
      "AI insights failed. Falling back to deterministic insights:",
      error.message
    );
    return fallbackInsights;
  }
}
