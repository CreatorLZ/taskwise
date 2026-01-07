// This file contains the function to create a task from a command using Gemini API.
// It includes error handling and JSON parsing logic.
// Uses centralized Gemini service for caching, rate limiting, and monitoring.

import Task, { ITask } from "../models/Task";
import geminiService from "../services/geminiService";

export const createTaskFromNLP = async (
  command: string,
  userId: string
): Promise<ITask> => {
  // Validate command and userId
  try {
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

    // Gemini API call with timeout using centralized service
    const output = await geminiService.generateContent(
      prompt,
      {
        maxOutputTokens: 1500, // Increased further to prevent any truncation
        temperature: 0.2, // Lower temperature for more consistent output
        topP: 0.95,
        // @ts-ignore - responseMimeType is supported in newer models/SDKs
        responseMimeType: "application/json",
      },
      15000
    );

    console.log("Model response:", output);

    // Clean output to remove Markdown code blocks
    let cleanedOutput = output
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    // JSON parsing approach
    try {
      const structuredTask = JSON.parse(cleanedOutput);
      const task = await createTaskFromData(
        structuredTask,
        userId,
        currentDate
      );

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

          return task;
        } catch (innerError) {
          console.error("Failed to parse extracted JSON");
        }
      }

      const jsonRegex = /\{[\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/g;
      const matches = cleanedOutput.match(jsonRegex);

      if (!matches) {
        const simpleJsonRegex = /\{[\s\S]*?\}/g;
        const simpleMatches = cleanedOutput.match(simpleJsonRegex);
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

//  expected task structure from LLM (dates are strings in JSON)
interface LLMTaskInput {
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  dueDate: string | Date;
  status: string;
  reminderTime: string | Date;
  userId: string;
}

const createTaskFromData = async (
  structuredTask: LLMTaskInput,
  userId: string,
  currentDate: Date
): Promise<ITask> => {
  const parsedDueDate = new Date(structuredTask.dueDate);
  parsedDueDate.setHours(parsedDueDate.getHours() - 1);

  const taskData = {
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
