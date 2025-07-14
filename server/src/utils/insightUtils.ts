import { GoogleGenerativeAI } from "@google/generative-ai";
import Task from "../models/Task";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateProductivityInsights(userId: string) {
  const tasks = await Task.find({ userId });
  const prompt = `
Analyze the following user's tasks and provide:
1. A personalized productivity insight (e.g., best time of day, work pattern, etc.)
2. A task optimization suggestion (e.g., break down tasks, focus area, etc.)
Return ONLY a JSON object:
{
  "productivityInsight": "...",
  "taskOptimization": "..."
}
Tasks: ${JSON.stringify(
    tasks.map((t) => ({
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      completed: t.completed,
      priority: t.priority,
      status: t.status,
    }))
  )}
`;

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
      topP: 0.95,
    },
  });

  // Try to extract JSON from the response
  const output = response.response.text();
  try {
    return JSON.parse(output.trim());
  } catch {
    // Fallback: extract JSON substring
    const jsonStart = output.indexOf("{");
    const jsonEnd = output.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd >= 0) {
      return JSON.parse(output.substring(jsonStart, jsonEnd + 1));
    }
    throw new Error("Failed to parse Gemini insight response");
  }
}
