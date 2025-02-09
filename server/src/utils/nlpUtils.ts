import { HfInference } from "@huggingface/inference";
import Task from "../models/Task";

// Initialize Hugging Face Inference API Client
const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Utility function to process NLP and create a task
export const createTaskFromNLP = async (command: string, userId: string) => {
  try {
    if (!userId) {
      throw new Error("userId is required but was not provided");
    }

    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString();

    let output = "";

    const stream = client.chatCompletionStream({
      model: "Qwen/Qwen2.5-Coder-32B-Instruct",
      messages: [
        {
          role: "system",
          content: `You are a task parser. Convert the following commands into structured task data in JSON format based on this schema:
          {
            "title": "string",
            "description": "string",
            "completed": false,
            "priority": "Low" | "Medium" | "High" | "Completed"
            "dueDate": "ISO date string",
            "status": "Pending" | "In-progress" | "Completed",
            "reminderTime": "ISO date string ten minutes before dueDate",
            "userId": "${userId}"
          }
          Ensure:
          - Default priority: "Medium".
          - Default status: "Pending".
          - Reminder: 24 hours before the due date if unspecified.
          - Parse dueDate from natural language.
          - Always return valid JSON without enclosing it in unnecessary block markers like \`\`\`json.
          - Use ${currentDateISO} as today's date. Reject dates before today.
          - Assign "userId": "${userId}" explicitly to each task.
          -always add a title
          -always add a description
          `,
        },
        {
          role: "user",
          content: command,
          userId,
        },
      ],
      max_tokens: 500,
    });

    for await (const chunk of stream) {
      if (chunk.choices && chunk.choices.length > 0) {
        const newContent = chunk.choices[0].delta.content;
        output += newContent;
        console.log("Streaming Output:", newContent);
      }
    }

    // Sanitize the response
    let sanitizedOutput = output.trim();

    // Remove ```json markers
    if (sanitizedOutput.startsWith("```json")) {
      sanitizedOutput = sanitizedOutput.slice(7); // Remove the opening ```json
    }
    if (sanitizedOutput.endsWith("```")) {
      sanitizedOutput = sanitizedOutput.slice(0, -3); // Remove the closing ```
    }

    // Parse the sanitized response into JSON
    let structuredTask;
    try {
      structuredTask = JSON.parse(sanitizedOutput);
    } catch (parseError) {
      console.error("Failed to parse JSON after sanitizing:", sanitizedOutput);
      throw new Error("Invalid JSON format returned from Hugging Face API");
    }

    // Ensure userId is explicitly set
    structuredTask.userId = userId;

    // Ensure defaults for required fields
    const taskData = {
      title: structuredTask.title || "Untitled Task",
      description: structuredTask.description,
      completed: false,
      priority: structuredTask.priority || "medium",
      dueDate: structuredTask.dueDate ? new Date(structuredTask.dueDate) : null,
      status: structuredTask.status || "pending",
      reminderTime: structuredTask.reminderTime
        ? new Date(structuredTask.reminderTime)
        : structuredTask.dueDate
        ? new Date(
            new Date(structuredTask.dueDate).getTime() - 24 * 60 * 60 * 1000
          )
        : undefined,
      userId: structuredTask.userId,
    };

    if (!taskData.dueDate) {
      throw new Error("dueDate is required but not provided");
    }

    if (taskData.dueDate < currentDate) {
      throw new Error(
        `Invalid dueDate: ${taskData.dueDate}. Date cannot be in the past.`
      );
    }

    const task = await Task.create(taskData);

    return task;
  } catch (error: any) {
    console.error("Error creating task from NLP:", error);
    throw new Error("Failed to process the command and create a task");
  }
};
