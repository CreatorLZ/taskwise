import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in environment variables.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const modelResponse = await genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    }).apiKey;
    // The SDK doesn't have a direct 'listModels' on the main class in some versions,
    // but usually it's manager-based. Let's try to access the model list if possible
    // or just checking documentation-like behavior if I can't find the exact method.
    // Actually, looking at docs, it is usually managed via API.

    // Let's rely on a direct fetch if SDK doesn't expose it easily or use a known pattern.
    // Most recent SDKs might vary.
    // Let's try the standard fetch which is reliable.

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    console.log("Available Gemini Models:");
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (${m.displayName}): ${m.description}`);
        console.log(
          `  Supported methods: ${m.supportedGenerationMethods.join(", ")}`
        );
      });
    } else {
      console.log("No models found or unexpected format: ", data);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
