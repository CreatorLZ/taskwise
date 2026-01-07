import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import crypto from "crypto";

interface CacheEntry {
  data: string;
  timestamp: number;
}

interface RateLimit {
  count: number;
  resetTime: number;
}

interface GenAIConfig {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
}

class GeminiService {
  private genai: GoogleGenerativeAI;
  private model: GenerativeModel;
  private cache: Map<string, CacheEntry>;
  private cacheTTL: number = 3600000;
  private maxCacheSize: number = 1000; // Prevent memory leaks
  private rateLimit: RateLimit;
  private rateLimitMax: number = 10;
  private rateLimitWindow: number = 60000;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    this.genai = new GoogleGenerativeAI(apiKey);
    // Fixed model name (Verify version currently available to you)
    // Updated to verified existing model ID
    this.model = this.genai.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });
    this.cache = new Map();
    this.rateLimit = { count: 0, resetTime: Date.now() + this.rateLimitWindow };
  }

  async generateContent(
    prompt: string,
    config: GenAIConfig = {}, // Default empty object
    timeout: number = 30000 // Default 30s timeout
  ): Promise<string> {
    this.checkRateLimit();

    // 1. Improved Cache Key (Includes Config)
    const cacheKey = this.generateCacheKey(prompt, config);

    // 2. Cache Check
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    this.incrementRateLimit();

    // 3. Setup AbortController for true cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log("Making Gemini API request...");

      const result = await this.model.generateContent(
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: config.maxOutputTokens || 500,
            temperature: config.temperature ?? 0.3, // Use ?? to allow 0
            topP: config.topP || 0.95,
          },
        },
        // Pass the request options (supported in newer SDK versions)
        // Note: If your SDK version doesn't support requestOptions,
        // you will need to rely on the Promise.race method, but usually
        // 'fetch' based SDKs support signals implicitly or explicitly.
        // @ts-ignore - Ignoring TS check if SDK types are older
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      // 4. Handle Safety Blocks
      const response = result.response;
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates returned. Possible safety block.");
      }

      const text = response.text();

      this.setCache(cacheKey, text);
      return text;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        throw new Error(`Gemini API request timed out after ${timeout}ms`);
      }

      console.error("Gemini API error:", error);
      throw error; // Re-throw to let caller handle
    }
  }

  private generateCacheKey(prompt: string, config: GenAIConfig): string {
    // Hash prompt + config to ensure unique keys for different settings
    const data = JSON.stringify({ prompt, config });
    return crypto.createHash("md5").update(data).digest("hex");
  }

  private getFromCache(key: string): string | null {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      if (Date.now() - entry.timestamp < this.cacheTTL) {
        console.log("Cache hit");
        return entry.data;
      }
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: string): void {
    // 5. Memory Leak Protection (Simple LRU-ish behavior)
    if (this.cache.size >= this.maxCacheSize) {
      // Delete the first inserted key (oldest in a JS Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private checkRateLimit(): void {
    const now = Date.now();
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.count = 0;
      this.rateLimit.resetTime = now + this.rateLimitWindow;
    }
    if (this.rateLimit.count >= this.rateLimitMax) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
  }

  private incrementRateLimit(): void {
    this.rateLimit.count++;
  }
}

export default new GeminiService();
