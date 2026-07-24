import Task, { ITask } from "../models/Task";
import { getGeminiService } from "../services/geminiService";
import calculateTimeProgress from "./calculateTimeProgress";
import { AiJsonParseError, parseJsonArray } from "./aiJsonUtils";
import { format, formatDistanceToNow } from "date-fns";

const VALID_PRIORITIES = ["Low", "Medium", "High", "Completed"] as const;
const VALID_STATUSES = ["Pending", "In-progress", "Completed"] as const;

type TaskPriority = (typeof VALID_PRIORITIES)[number];
type TaskStatus = (typeof VALID_STATUSES)[number];

interface PriorityRecommendation {
  taskId: string;
  newPriority: TaskPriority;
  newStatus: TaskStatus;
  reason: string;
}

const isPriority = (value: string): value is TaskPriority =>
  VALID_PRIORITIES.includes(value as TaskPriority);

const isStatus = (value: string): value is TaskStatus =>
  VALID_STATUSES.includes(value as TaskStatus);

const taskId = (task: ITask): string => String(task._id);

const formatTaskForClient = (task: ITask) => {
  const createdAt = task.createdAt ?? new Date();

  return {
    ...task.toObject(),
    dueDate: task.dueDate.toISOString(),
    dueTime: formatDistanceToNow(new Date(task.dueDate), {
      addSuffix: true,
    }),
    formattedDueDate: format(new Date(task.dueDate), "MMM d, yyyy h:mm a"),
    startDate: format(new Date(createdAt), "yyyy-MM-dd"),
    progress: calculateTimeProgress(
      createdAt.toISOString(),
      task.dueDate.toISOString()
    ),
  };
};

const getFallbackRecommendation = (
  task: ITask,
  referenceDate: Date
): PriorityRecommendation => {
  if (task.completed || task.status === "Completed") {
    return {
      taskId: taskId(task),
      newPriority: "Completed",
      newStatus: "Completed",
      reason: "Task is already completed.",
    };
  }

  const msUntilDue = task.dueDate.getTime() - referenceDate.getTime();
  const hoursUntilDue = msUntilDue / (1000 * 60 * 60);

  if (hoursUntilDue < 0) {
    return {
      taskId: taskId(task),
      newPriority: "High",
      newStatus: "Pending",
      reason: "Task is overdue.",
    };
  }

  if (hoursUntilDue <= 24) {
    return {
      taskId: taskId(task),
      newPriority: "High",
      newStatus: task.status === "Completed" ? "Completed" : "In-progress",
      reason: "Task is due within 24 hours.",
    };
  }

  if (hoursUntilDue <= 72) {
    return {
      taskId: taskId(task),
      newPriority: "Medium",
      newStatus: task.status === "Completed" ? "Completed" : "Pending",
      reason: "Task is due within the next three days.",
    };
  }

  return {
    taskId: taskId(task),
    newPriority: "Low",
    newStatus: task.status === "Completed" ? "Completed" : "Pending",
    reason: "Task has enough lead time.",
  };
};

const getAiRecommendations = async (
  tasks: ITask[],
  referenceDate: Date
): Promise<PriorityRecommendation[]> => {
  const prompt = `Return a JSON array only. No markdown. No prose.

Reference date: ${referenceDate.toISOString()}

Rules:
- Preserve Completed tasks as Completed.
- Overdue tasks should usually be High priority and Pending unless completed.
- Tasks due within 24 hours should usually be High priority.
- Tasks due within 3 days should usually be Medium priority.
- Use Low priority only when there is enough lead time and no urgency.
- Return one recommendation per task.

Each array item must use this shape:
{
  "taskId": "string",
  "newPriority": "Low" | "Medium" | "High" | "Completed",
  "newStatus": "Pending" | "In-progress" | "Completed",
  "reason": "short practical reason"
}

Tasks:
${JSON.stringify(
  tasks.map((task) => ({
    taskId: taskId(task),
    title: task.title,
    priority: task.priority,
    status: task.status,
    completed: task.completed,
    dueDate: task.dueDate.toISOString(),
    createdAt: task.createdAt?.toISOString(),
  })),
  null,
  2
)}`;

  const output = await getGeminiService().generateContent(
    prompt,
    {
      maxOutputTokens: 4096,
      temperature: 0,
      topP: 0.9,
      responseMimeType: "application/json",
      thinkingLevel: "low",
    },
    15000
  );

  const parsed = parseJsonArray<PriorityRecommendation>(output);

  return parsed.filter(
    (item) =>
      typeof item.taskId === "string" &&
      isPriority(item.newPriority) &&
      isStatus(item.newStatus) &&
      typeof item.reason === "string"
  );
};

const applyRecommendations = async (
  tasks: ITask[],
  recommendations: PriorityRecommendation[]
) => {
  const recommendationsByTaskId = new Map(
    recommendations.map((recommendation) => [
      recommendation.taskId,
      recommendation,
    ])
  );

  for (const task of tasks) {
    const recommendation = recommendationsByTaskId.get(taskId(task));
    if (!recommendation) continue;

    let isUpdated = false;

    if (recommendation.newPriority !== task.priority) {
      task.priorityLogs.push({
        oldPriority: task.priority,
        newPriority: recommendation.newPriority,
        reason: recommendation.reason,
        timestamp: new Date(),
      });
      task.previousPriority = task.priority;
      task.priority = recommendation.newPriority;
      isUpdated = true;
    }

    if (recommendation.newStatus !== task.status) {
      task.status = recommendation.newStatus;
      isUpdated = true;
    }

    if (recommendation.newStatus === "Completed") {
      task.completed = true;
    }

    if (isUpdated) {
      task.retouchedByAI = true;
      await task.save();
    }
  }
};

export const analyzeAndPrioritizeTasks = async (userId: string) => {
  if (!userId) {
    throw new Error("userId is required but was not provided.");
  }

  const referenceDate = new Date();
  const tasks = await Task.find({ userId, completed: false })
    .sort({ dueDate: 1, createdAt: 1 })
    .limit(10);

  if (tasks.length === 0) {
    return [];
  }

  let recommendations: PriorityRecommendation[];

  try {
    recommendations = await getAiRecommendations(tasks, referenceDate);

    if (recommendations.length === 0) {
      throw new Error("AI returned no valid task recommendations");
    }
  } catch (error: any) {
    if (error instanceof AiJsonParseError) {
      console.warn("[AI prioritization] Invalid JSON response from Gemini", {
        message: error.message,
        responsePreview: error.responsePreview,
      });
    }

    console.warn(
      "AI prioritization failed. Falling back to deterministic prioritization:",
      error.message
    );
    recommendations = tasks.map((task) =>
      getFallbackRecommendation(task, referenceDate)
    );
  }

  await applyRecommendations(tasks, recommendations);

  const updatedTasks = await Task.find({ userId }).sort({
    createdAt: -1,
    priority: -1,
    dueDate: 1,
  });

  return updatedTasks.map(formatTaskForClient);
};
