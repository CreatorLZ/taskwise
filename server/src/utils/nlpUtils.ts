import { HfInference } from "@huggingface/inference";
import Task from "../models/Task";

const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const createTaskFromNLP = async (command: string, userId: string) => {
  try {
    if (!userId) {
      throw new Error("userId is required but was not provided");
    }

    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString();

    const prompt = `Convert this command into a JSON task object. Return only valid JSON:
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

Use ${currentDateISO} as today's date. Set reminderTime 1h before dueDate.`;

    const response = await client.textGeneration({
      model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.6,
        return_full_text: false,
      },
    });

    let output = response.generated_text;
    console.log("Model response:", output);

    // Extract JSON object using regex
    const jsonRegex = /\{[\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/g;
    // Find all JSON-like structures
    const matches = output.match(jsonRegex);

    if (!matches) {
      // Try a simpler regex if the nested match fails
      const simpleJsonRegex = /\{[\s\S]*?\}/g;
      const simpleMatches = output.match(simpleJsonRegex);
      if (!simpleMatches) {
        throw new Error("No JSON object found in response");
      }
      // Take the longest match as it's likely the complete JSON
      const jsonStr = simpleMatches.reduce((a, b) =>
        a.length > b.length ? a : b
      );
      try {
        const structuredTask = JSON.parse(jsonStr);
        return await createTaskFromData(structuredTask, userId, currentDate);
      } catch (error) {
        console.error("Failed to parse simple JSON match:", jsonStr);
        throw new Error("Invalid JSON format in response");
      }
    }

    // Take the longest match as it's likely the complete JSON
    const jsonStr = matches.reduce((a, b) => (a.length > b.length ? a : b));

    try {
      const structuredTask = JSON.parse(jsonStr);
      return await createTaskFromData(structuredTask, userId, currentDate);
    } catch (error) {
      console.error("Failed to parse JSON:", jsonStr);
      throw new Error("Invalid JSON format in response");
    }
  } catch (error: any) {
    console.error("Error creating task from NLP:", error);
    throw new Error(`Failed to process command: ${error.message}`);
  }
};

// Helper function to create task from parsed data
const createTaskFromData = async (
  structuredTask: any,
  userId: string,
  currentDate: Date
) => {
  const taskData = {
    title: structuredTask.title || "Untitled Task",
    description: structuredTask.description,
    completed: false,
    priority: structuredTask.priority || "Medium",
    dueDate: new Date(structuredTask.dueDate),
    status: structuredTask.status || "Pending",
    reminderTime: structuredTask.reminderTime
      ? new Date(structuredTask.reminderTime)
      : new Date(
          new Date(structuredTask.dueDate).getTime() - 24 * 60 * 60 * 1000
        ),
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
