// This file contains the function to create a task from a command using Gemini API.
// It includes error handling, caching, and JSON parsing logic.

import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/Task";

// Initialize Gemini client with API key
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

// In-memory cache implementation
interface CacheEntry {
  timestamp: number;
  data: any;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export const createTaskFromNLP = async (
  command: string,
  userId: string
): Promise<any> => {
  // Validate command and userId
  try {
    if (!userId) {
      throw new Error("userId is required but was not provided");
    }

    // Generate and check cache
    const cacheKey = `${command}-${userId}`;
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey) as CacheEntry;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("Cache hit for command:", command);
        return cached.data;
      }
    }

    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString();

    const prompt = `Convert this command into a JSON task object. Return ONLY valid JSON without any explanation or additional text:
Command: ${command}

JSON format:
{
  "title": "clear title",
  "description": "detailed description",
  "completed": false,
  "priority": "Medium",
  "dueDate": "ISO date string",
  "status": "Pending",
  "reminderTime": "ISO date string",
  "userId": "${userId}"
}

Important time handling instructions:
1. Use ${currentDateISO} as reference for today's date
2. For time, use the EXACT hour specified in the command (e.g., "7pm" should be 19:00, not 20:00)
3. Do NOT adjust or convert time zones - use the exact time as specified
4. If a specific time is mentioned (like "7pm" or "10:30"), use exactly that time
5. If no time is specified, default to 23:59 (end of day)`;

    // Gemini API call with timeout
    const response = await Promise.race([
      model
        .generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.3,
            topP: 0.95,
          },
        })
        .then((result) => result.response.text()),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Model inference timeout")), 15000)
      ),
    ]);

    let output: string = response;
    console.log("Model response:", output);

    // JSON parsing approach
    try {
      const structuredTask = JSON.parse(output.trim());
      const task = await createTaskFromData(
        structuredTask,
        userId,
        currentDate
      );

      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: task,
      });

      return task;
    } catch (error) {
      console.log("Direct JSON parsing failed, trying extraction...");

      const jsonStart = output.indexOf("{");
      const jsonEnd = output.lastIndexOf("}");

      if (jsonStart >= 0 && jsonEnd >= 0) {
        try {
          const jsonStr = output.substring(jsonStart, jsonEnd + 1);
          const structuredTask = JSON.parse(jsonStr);
          const task = await createTaskFromData(
            structuredTask,
            userId,
            currentDate
          );

          responseCache.set(cacheKey, {
            timestamp: Date.now(),
            data: task,
          });

          return task;
        } catch (innerError) {
          console.error("Failed to parse extracted JSON");
        }
      }

      const jsonRegex = /\{[\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/g;
      const matches = output.match(jsonRegex);

      if (!matches) {
        const simpleJsonRegex = /\{[\s\S]*?\}/g;
        const simpleMatches = output.match(simpleJsonRegex);
        if (!simpleMatches) {
          throw new Error("No JSON object found in response");
        }
        const jsonStr = simpleMatches.reduce((a, b) =>
          a.length > b.length ? a : b
        );
        try {
          const structuredTask = JSON.parse(jsonStr);
          const task = await createTaskFromData(
            structuredTask,
            userId,
            currentDate
          );

          responseCache.set(cacheKey, {
            timestamp: Date.now(),
            data: task,
          });

          return task;
        } catch (error) {
          console.error("Failed to parse simple JSON match:", jsonStr);
          throw new Error("Invalid JSON format in response");
        }
      }

      const jsonStr = matches.reduce((a, b) => (a.length > b.length ? a : b));

      try {
        const structuredTask = JSON.parse(jsonStr);
        const task = await createTaskFromData(
          structuredTask,
          userId,
          currentDate
        );

        responseCache.set(cacheKey, {
          timestamp: Date.now(),
          data: task,
        });

        return task;
      } catch (error) {
        console.error("Failed to parse JSON:", jsonStr);
        throw new Error("Invalid JSON format in response");
      }
    }
  } catch (error: any) {
    console.error("Error creating task from NLP:", error);
    throw new Error(`Failed to process command: ${error.message}`);
  }
};

//  expected task structure
interface TaskData {
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  dueDate: Date;
  status: string;
  reminderTime: Date;
  userId: string;
}

const createTaskFromData = async (
  structuredTask: any,
  userId: string,
  currentDate: Date
): Promise<any> => {
  // Replace 'any' with Task type isaac dont be lazy and stupid
  const parsedDueDate = new Date(structuredTask.dueDate);
  parsedDueDate.setHours(parsedDueDate.getHours() - 1);

  const taskData: TaskData = {
    title: structuredTask.title || "Untitled Task",
    description: structuredTask.description,
    completed: false,
    priority: structuredTask.priority || "Medium",
    dueDate: parsedDueDate,
    status: structuredTask.status || "Pending",
    reminderTime: structuredTask.reminderTime
      ? new Date(structuredTask.reminderTime)
      : new Date(parsedDueDate.getTime() - 24 * 60 * 60 * 1000),
    userId: userId,
  };

  if (isNaN(taskData.dueDate.getTime())) {
    throw new Error("Invalid dueDate format");
  }

  if (taskData.dueDate < currentDate) {
    throw new Error("dueDate cannot be in the past");
  }

  return await Task.create(taskData);
};
