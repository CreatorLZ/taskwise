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
  responseMimeType?: string;
  thinkingBudget?: number;
  thinkingLevel?: "low" | "medium" | "high";
}

interface GeminiDiagnostics {
  requestId: string;
  model: string;
  durationMs: number;
  finishReason?: string;
  blockReason?: string;
  safetyRatings?: unknown;
}

export class GeminiServiceError extends Error {
  diagnostics?: GeminiDiagnostics;

  constructor(message: string, diagnostics?: GeminiDiagnostics) {
    super(message);
    this.name = "GeminiServiceError";
    this.diagnostics = diagnostics;
  }
}

class GeminiService {
  private genai: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;
  private cache: Map<string, CacheEntry>;
  private cacheTTL: number = 3600000;
  private maxCacheSize: number = 1000; // Prevent memory leaks
  private rateLimit: RateLimit;
  private rateLimitMax: number = 10;
  private rateLimitWindow: number = 60000;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    this.modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    this.genai = new GoogleGenerativeAI(apiKey);
    this.model = this.genai.getGenerativeModel({ model: this.modelName });
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
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();

    try {
      console.log(
        `[Gemini] request ${requestId} started model=${this.modelName}`
      );

      const generationConfig: Record<string, unknown> = {
        maxOutputTokens: config.maxOutputTokens || 500,
        temperature: config.temperature ?? 0.3,
        topP: config.topP || 0.95,
        responseMimeType: config.responseMimeType,
      };

      if (typeof config.thinkingLevel === "string") {
        generationConfig.thinkingConfig = {
          thinkingLevel: config.thinkingLevel,
        };
      } else if (typeof config.thinkingBudget === "number") {
        generationConfig.thinkingConfig = {
          thinkingBudget: config.thinkingBudget,
        };
      }

      const result = await this.model.generateContent(
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        },
        // Pass the request options (supported in newer SDK versions)
        // Note: If your SDK version doesn't support requestOptions,
        // you will need to rely on the Promise.race method, but usually
        // 'fetch' based SDKs support signals implicitly or explicitly.
        // @ts-ignore - Ignoring TS check if SDK types are older
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startedAt;

      // 4. Handle Safety Blocks
      const response = result.response;
      const firstCandidate = response.candidates?.[0];
      const diagnostics: GeminiDiagnostics = {
        requestId,
        model: this.modelName,
        durationMs,
        finishReason: firstCandidate?.finishReason,
        safetyRatings: firstCandidate?.safetyRatings,
      };

      if (!response.candidates || response.candidates.length === 0) {
        const blockReason = response.promptFeedback?.blockReason;
        this.logGeminiFailure("No candidates returned", {
          ...diagnostics,
          blockReason,
        });
        throw new GeminiServiceError(
          blockReason
            ? `No candidates returned. Prompt blocked: ${blockReason}`
            : "No candidates returned. Possible safety block.",
          { ...diagnostics, blockReason }
        );
      }

      const text = response.text();
      console.log(
        `[Gemini] request ${requestId} completed durationMs=${durationMs} finishReason=${
          firstCandidate?.finishReason || "unknown"
        } textLength=${text.length}`
      );

      this.setCache(cacheKey, text);
      return text;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startedAt;

      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        const timeoutError = new GeminiServiceError(
          `Gemini API request timed out after ${timeout}ms`,
          {
            requestId,
            model: this.modelName,
            durationMs,
          }
        );
        this.logGeminiFailure(timeoutError.message, timeoutError.diagnostics);
        throw timeoutError;
      }

      if (error instanceof GeminiServiceError) {
        throw error;
      }

      const message =
        error?.message || error?.statusText || "Unknown Gemini API error";
      const serviceError = new GeminiServiceError(message, {
        requestId,
        model: this.modelName,
        durationMs,
      });
      this.logGeminiFailure(message, serviceError.diagnostics, error);
      throw serviceError;
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

  private logGeminiFailure(
    message: string,
    diagnostics?: GeminiDiagnostics,
    rawError?: unknown
  ): void {
    console.error("[Gemini] request failed", {
      message,
      diagnostics,
      rawError:
        rawError instanceof Error
          ? {
              name: rawError.name,
              message: rawError.message,
              stack:
                process.env.NODE_ENV === "development"
                  ? rawError.stack
                  : undefined,
            }
          : rawError,
    });
  }
}

export default new GeminiService();
