import { HfInference } from "@huggingface/inference";
import Task from "../models/Task";

// Initialize Hugging Face Inference API Client
const client = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Analyze and prioritize tasks for a specific user using AI.
 * Adjusts priorities and statuses based on workload, deadlines, and other factors.
 * @param userId - ID of the user whose tasks are to be analyzed.
 */
export const analyzeAndPrioritizeTasks = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("userId is required but was not provided.");
    }

    const currentDate = new Date();

    // Fetch tasks for the user that are incomplete and have a valid due date in the future
    const tasks = await Task.find({
      userId,
      completed: false,
      dueDate: { $gte: currentDate },
    });

    if (tasks.length === 0) {
      console.log(`No eligible tasks to analyze for user ${userId}.`);
      return;
    }

    for (const task of tasks) {
      const { _id, title, description, priority, dueDate } = task;

      console.log(`Analyzing task for user ${userId}: ${title}`);

      // Prepare context for AI analysis
      const analysisInput = `
        Analyze the following task data and recommend any priority/status changes if necessary:
        Task: ${title}
        Description: ${description || "No description provided"}
        Current Priority: ${priority}
        Due Date: ${dueDate.toISOString()}
        Guidelines:
        - Recommend "low", "medium", "completed" or "high" for priority.
        - Adjust task status based on due date and urgency.
        - Provide a reason for any suggested changes.
        - Use ${currentDate.toISOString()} as the reference date.
      `;

      // AI API call
      let output = "";
      const stream = client.chatCompletionStream({
        model: "Qwen/Qwen2.5-Coder-32B-Instruct",
        messages: [
          {
            role: "system",
            content: `
              You are an advanced task analyzer. Given task details, recommend changes to priority/status with explanations.make sure to always change priority to completed if status shows completed
              Always respond with valid JSON in this schema:
              {
                "newPriority": "low" | "medium" | "high" | "completed",
                "newStatus": "pending" | "in-progress" | "completed",
                "reason": "string"
              }
              Do not include additional headings or explanations outside of JSON.
            `,
          },
          { role: "user", content: analysisInput },
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

      // Sanitize and parse the AI output
      let sanitizedOutput = output.trim();

      // Remove unwanted markers (if any)
      if (sanitizedOutput.startsWith("```json")) {
        sanitizedOutput = sanitizedOutput.slice(7); // Remove opening ```json
      }
      if (sanitizedOutput.endsWith("```")) {
        sanitizedOutput = sanitizedOutput.slice(0, -3); // Remove closing ```
      }

      let aiResponse;
      try {
        aiResponse = JSON.parse(sanitizedOutput);
      } catch (parseError) {
        console.error("Failed to parse AI output as JSON:", sanitizedOutput);
        console.error("Raw AI Response:", sanitizedOutput);
        continue; // Skip this task and process the next one
      }

      // Validate AI response structure
      if (
        !aiResponse.newPriority ||
        !aiResponse.newStatus ||
        typeof aiResponse.reason !== "string"
      ) {
        console.error("Invalid AI response structure:", aiResponse);
        continue; // Skip this task and process the next one
      }

      // Extract suggested changes
      const newPriority = aiResponse.newPriority || priority; // Default to current priority if none provided
      const newStatus = aiResponse.newStatus || task.status; // Default to current status
      const reason = aiResponse.reason || "No specific reason provided";

      // Check if updates are needed
      let isUpdated = false;

      if (newPriority !== priority) {
        task.priorityLogs.push({
          oldPriority: priority,
          newPriority,
          reason,
          timestamp: new Date(),
        });
        task.priority = newPriority;
        isUpdated = true;
      }

      if (newStatus !== task.status) {
        task.status = newStatus;
        isUpdated = true;
      }

      if (isUpdated) {
        task.retouchedByAI = true; // Mark task as analyzed/retouched by AI
        await task.save();
        console.log(
          `Task ${title} updated: Priority - ${priority} → ${newPriority}, Status - ${newStatus}`
        );
      } else {
        console.log(`No changes needed for task ${title}.`);
      }
    }

    console.log(
      `Task analysis and prioritization complete for user ${userId}.`
    );
  } catch (error) {
    console.error("Error during task analysis and prioritization:", error);
    throw new Error("Failed to analyze and prioritize tasks.");
  }
};
