import "dotenv/config";
import { getGeminiService } from "../services/geminiService";

async function main() {
  const objectResponse = await getGeminiService().generateContent(
    'Return only this JSON object: {"ok": true}',
    {
      maxOutputTokens: 256,
      temperature: 0,
      responseMimeType: "application/json",
      thinkingLevel: "low",
    },
    20000
  );

  console.log("Object response:");
  console.log(objectResponse);

  const arrayResponse = await getGeminiService().generateContent(
    `Return only a JSON array with one recommendation:
[
  {
    "taskId": "sample-task",
    "newPriority": "High",
    "newStatus": "Pending",
    "reason": "Due soon"
  }
]`,
    {
      maxOutputTokens: 512,
      temperature: 0,
      responseMimeType: "application/json",
      thinkingLevel: "low",
    },
    20000
  );

  console.log("Array response:");
  console.log(arrayResponse);

  const taskResponse = await getGeminiService().generateContent(
    `Convert this command into a JSON task object. Return JSON only.

Command: create a task to submit the product report tomorrow at 5pm
Current date/time reference: ${new Date().toISOString()}

Required shape:
{
  "title": "clear title",
  "description": "short description",
  "completed": false,
  "priority": "Low" | "Medium" | "High",
  "dueDate": "ISO 8601 date string",
  "status": "Pending",
  "reminderTime": "ISO 8601 date string"
}`,
    {
      maxOutputTokens: 1024,
      temperature: 0,
      topP: 0.9,
      responseMimeType: "application/json",
      thinkingLevel: "low",
    },
    20000
  );

  console.log("Task response:");
  console.log(taskResponse);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
