import geminiService from "../services/geminiService";
import Task from "../models/Task";

export async function generateProductivityInsights(
  userId: string,
  userName: string
) {
  const tasks = await Task.find({ userId });
  const prompt = `You are Taskwise, an advanced task management and productivity assistant. Provide actionable, insightful, and personalized advice.

When providing insights, personalize them by addressing the user as "you" instead of "User".

Analyze the following tasks for the user "${userName}" and provide:
1. A unique productivity insight (e.g., best time of day, completion trends, etc.)
2. A unique task optimization suggestion (e.g., how to improve task completion, breakdown suggestions, etc.)
Return only a JSON object like:
{
  "productivityInsight": "...",
  "taskOptimizationInsight": "..."
}
Tasks: ${JSON.stringify(tasks, null, 2)}`;

  const response = await geminiService.generateContent(prompt, {
    maxOutputTokens: 300,
    temperature: 0.7,
  });

  // Extract JSON from response
  const output = response;
  // Clean output to remove Markdown code blocks
  let cleanedOutput = output
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  try {
    const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      productivityInsight: "No insight generated.",
      taskOptimizationInsight: "No suggestion generated.",
    };
  } catch {
    return {
      productivityInsight: "No insight generated.",
      taskOptimizationInsight: "No suggestion generated.",
    };
  }
}
