import { HfInference } from "@huggingface/inference";
import Task from "../models/Task";

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

// in-memory cache implementation
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export const createTaskFromNLP = async (command: string, userId: string) => {
  try {
    if (!userId) {
      throw new Error("userId is required but was not provided");
    }

    // Generate and check cache
    const cacheKey = `${command}-${userId}`;
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("Cache hit for command:", command);
        return cached.data;
      }
    }

    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString();

    const prompt = `Convert this command into a JSON task object. Return ONLY valid JSON without any explanation:
Command: ${command}

JSON format:
{
  "title": "clear title",
  "description": "detailed description",
  "completed": false,
  "priority": "Medium",
  "dueDate": "ISO date string ",
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

    const response = (await Promise.race([
      client.textGeneration({
        // Changed to smaller, faster model
        // model: "mistralai/Mistral-7B-Instruct-v0.2", // Changed from deepseek-ai/DeepSeek-R1-Distill-Qwen-32B
        model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", // Changed from deepseek-ai/DeepSeek-R1-Distill-Qwen-32B

        inputs: prompt,
        parameters: {
          // Optimized generation parameters
          max_new_tokens: 300,
          temperature: 0.3,
          return_full_text: false,
          top_p: 0.95,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Model inference timeout")), 15000)
      ),
    ])) as { generated_text: string };

    let output = response.generated_text;
    console.log("Model response:", output);

    // JSON parsing approach
    try {
      // First try: direct JSON parsing
      const structuredTask = JSON.parse(output.trim());
      const task = await createTaskFromData(
        structuredTask,
        userId,
        currentDate
      );

      //Cache successful result
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: task,
      });

      return task;
    } catch (error) {
      console.log("Direct JSON parsing failed, trying extraction...");

      // Second try: Find JSON by bracket matching
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

          //  Cache successful result
          responseCache.set(cacheKey, {
            timestamp: Date.now(),
            data: task,
          });

          return task;
        } catch (innerError) {
          console.error("Failed to parse extracted JSON");
        }
      }

      // If everything fails, fall back to the original regex approach😑😑
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

          // Cache successful result
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

        //Cache successful result
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

const createTaskFromData = async (
  structuredTask: any,
  userId: string,
  currentDate: Date
) => {
  // Parse the due date from the string
  const parsedDueDate = new Date(structuredTask.dueDate);

  // Subtract one hour to fix the offset issue
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

  // Validate dates
  if (isNaN(taskData.dueDate.getTime())) {
    throw new Error("Invalid dueDate format");
  }

  if (taskData.dueDate < currentDate) {
    throw new Error("dueDate cannot be in the past");
  }

  return await Task.create(taskData);
};
