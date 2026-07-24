// This file contains the function to create a task from a command using Gemini API.
// It includes error handling and JSON parsing logic.
// Uses centralized Gemini service for caching, rate limiting, and monitoring.

import Task, { ITask } from "../models/Task";
import { getGeminiService } from "../services/geminiService";
import { AiJsonParseError, parseJsonObject } from "./aiJsonUtils";

const VALID_PRIORITIES = ["Low", "Medium", "High"] as const;
const VALID_STATUSES = ["Pending", "In-progress", "Completed"] as const;

type TaskPriority = (typeof VALID_PRIORITIES)[number];
type TaskStatus = (typeof VALID_STATUSES)[number];

export const createTaskFromNLP = async (
  command: string,
  userId: string
): Promise<ITask> => {
  if (!userId) {
    throw new Error("userId is required but was not provided");
  }

  const currentDate = new Date();
  const currentDateISO = currentDate.toISOString();

  const prompt = `You are a task parsing assistant. Convert this command into a JSON task object. Return ONLY valid JSON without any explanation or additional text.

Command: ${command}

Current date/time reference: ${currentDateISO}

JSON format (all fields required):
{
  "title": "clear, concise title",
  "description": "detailed description of the task",
  "completed": false,
  "priority": "Low" | "Medium" | "High",
  "dueDate": "ISO 8601 date string",
  "status": "Pending",
  "reminderTime": "ISO 8601 date string (1 hour before dueDate)",
  "userId": "${userId}"
}

TIME HANDLING RULES:
1. For specific times (e.g., "7pm", "10:30am"), use EXACTLY that time
2. For vague time references, use these defaults:
   - "morning" or "early" → 09:00
   - "noon" or "midday" → 12:00
   - "afternoon" → 14:00 (2pm)
   - "evening" → 18:00 (6pm)
   - "night" or "tonight" → 21:00 (9pm)
   - "end of day" or no time specified → 23:59
3. For relative dates:
   - "today" → use current date
   - "tomorrow" → next day
   - "next week" → 7 days from now
4. Do NOT adjust timezones - output times as-is
5. Always output complete, valid JSON with all fields`;

  try {
    // Gemini API call with timeout using centralized service
    const output = await getGeminiService().generateContent(
      prompt,
      {
        maxOutputTokens: 1500, // Increased further to prevent any truncation
        temperature: 0,
        topP: 0.9,
        responseMimeType: "application/json",
        thinkingLevel: "low",
      },
      20000
    );

    console.log("Model response:", output);

    const structuredTask = parseJsonObject<LLMTaskInput>(output);
    return await createTaskFromData(structuredTask, userId, currentDate);
  } catch (error: any) {
    if (error instanceof AiJsonParseError) {
      console.warn("[AI NLP] Invalid JSON response from Gemini", {
        message: error.message,
        responsePreview: error.responsePreview,
      });
    }

    console.warn(
      "NLP AI task parsing failed. Falling back to deterministic parser:",
      error.message
    );
    return await createFallbackTask(command, userId, currentDate);
  }
};

//  expected task structure from LLM (dates are strings in JSON)
interface LLMTaskInput {
  title: string;
  description?: string;
  completed?: boolean;
  priority: string;
  dueDate: string | Date;
  status: string;
  reminderTime?: string | Date;
  userId?: string;
}

const createTaskFromData = async (
  structuredTask: LLMTaskInput,
  userId: string,
  currentDate: Date
): Promise<ITask> => {
  const parsedDueDate = new Date(structuredTask.dueDate);

  if (isNaN(parsedDueDate.getTime())) {
    throw new Error("Invalid dueDate format");
  }

  const priority = VALID_PRIORITIES.includes(
    structuredTask.priority as TaskPriority
  )
    ? structuredTask.priority
    : "Medium";
  const status = VALID_STATUSES.includes(structuredTask.status as TaskStatus)
    ? structuredTask.status
    : "Pending";

  const taskData = {
    title: structuredTask.title || "Untitled Task",
    description: structuredTask.description || "",
    completed: false,
    priority,
    dueDate: parsedDueDate,
    status,
    reminderTime: structuredTask.reminderTime
      ? new Date(structuredTask.reminderTime)
      : new Date(parsedDueDate.getTime() - 10 * 60 * 1000),
    userId: userId,
  };

  if (taskData.dueDate < currentDate) {
    throw new Error("dueDate cannot be in the past");
  }

  return await Task.create(taskData);
};

const createFallbackTask = async (
  command: string,
  userId: string,
  currentDate: Date
): Promise<ITask> => {
  const dueDate = parseDueDateFromCommand(command, currentDate);
  const title = normalizeFallbackTitle(command);

  return await Task.create({
    title,
    description:
      "Created without AI parsing because the AI service was unavailable.",
    completed: false,
    priority: inferPriority(command),
    dueDate,
    status: "Pending",
    reminderTime: new Date(dueDate.getTime() - 10 * 60 * 1000),
    userId,
  });
};

const normalizeFallbackTitle = (command: string): string => {
  const cleaned = command
    .replace(/^create a task to\s+/i, "")
    .replace(/^remind me to\s+/i, "")
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 200) : "Untitled Task";
};

const inferPriority = (command: string): TaskPriority => {
  const lower = command.toLowerCase();
  if (/\b(urgent|asap|important|critical|high priority)\b/.test(lower)) {
    return "High";
  }
  if (/\b(low priority|whenever|sometime)\b/.test(lower)) {
    return "Low";
  }
  return "Medium";
};

const parseDueDateFromCommand = (command: string, currentDate: Date): Date => {
  const lower = command.toLowerCase();
  const dueDate = new Date(currentDate);

  if (lower.includes("tomorrow")) {
    dueDate.setDate(dueDate.getDate() + 1);
  } else if (lower.includes("next week")) {
    dueDate.setDate(dueDate.getDate() + 7);
  } else if (!lower.includes("today")) {
    dueDate.setDate(dueDate.getDate() + 1);
  }

  const explicitTime = parseTime(lower);
  if (explicitTime) {
    dueDate.setHours(explicitTime.hours, explicitTime.minutes, 0, 0);
  } else if (lower.includes("morning") || lower.includes("early")) {
    dueDate.setHours(9, 0, 0, 0);
  } else if (lower.includes("noon") || lower.includes("midday")) {
    dueDate.setHours(12, 0, 0, 0);
  } else if (lower.includes("afternoon")) {
    dueDate.setHours(14, 0, 0, 0);
  } else if (lower.includes("evening")) {
    dueDate.setHours(18, 0, 0, 0);
  } else if (lower.includes("night") || lower.includes("tonight")) {
    dueDate.setHours(21, 0, 0, 0);
  } else {
    dueDate.setHours(23, 59, 0, 0);
  }

  if (dueDate <= currentDate) {
    dueDate.setDate(dueDate.getDate() + 1);
  }

  return dueDate;
};

const parseTime = (
  text: string
): { hours: number; minutes: number } | null => {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (hours > 23 || minutes > 59) return null;

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  }
  if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
};
