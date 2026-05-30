const RESPONSE_PREVIEW_LENGTH = 800;

export class AiJsonParseError extends Error {
  responsePreview: string;

  constructor(message: string, output: string) {
    super(message);
    this.name = "AiJsonParseError";
    this.responsePreview = sanitizePreview(output);
  }
}

const sanitizePreview = (output: string): string =>
  output
    .replace(/\s+/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .slice(0, RESPONSE_PREVIEW_LENGTH);

export const parseJsonObject = <T>(output: string): T => {
  const cleanedOutput = output
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleanedOutput) as T;
  } catch {
    const jsonStart = cleanedOutput.indexOf("{");
    const jsonEnd = cleanedOutput.lastIndexOf("}");

    if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(cleanedOutput.substring(jsonStart, jsonEnd + 1)) as T;
      } catch {
        throw new AiJsonParseError(
          "AI response contained a JSON-like object, but it was malformed",
          output
        );
      }
    }

    throw new AiJsonParseError("No valid JSON object found in AI response", output);
  }
};

export const parseJsonArray = <T>(output: string): T[] => {
  const cleanedOutput = output
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedOutput);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    const jsonStart = cleanedOutput.indexOf("[");
    const jsonEnd = cleanedOutput.lastIndexOf("]");

    if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
      try {
        const parsed = JSON.parse(
          cleanedOutput.substring(jsonStart, jsonEnd + 1)
        );
        if (Array.isArray(parsed)) return parsed as T[];
      } catch {
        throw new AiJsonParseError(
          "AI response contained a JSON-like array, but it was malformed",
          output
        );
      }
    }
  }

  throw new AiJsonParseError("No valid JSON array found in AI response", output);
};
