"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const crypto_1 = __importDefault(require("crypto"));
class GeminiService {
    constructor() {
        this.cacheTTL = 3600000; // 1 hour in milliseconds
        this.rateLimitMax = 10; // Max requests per window
        this.rateLimitWindow = 60000; // 1 minute in milliseconds
        this.genai = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genai.getGenerativeModel({ model: "gemini-2.5-flash" });
        this.cache = new Map();
        this.rateLimit = { count: 0, resetTime: Date.now() + this.rateLimitWindow };
    }
    generateContent(prompt, config, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check and reset rate limit
            if (Date.now() > this.rateLimit.resetTime) {
                this.rateLimit.count = 0;
                this.rateLimit.resetTime = Date.now() + this.rateLimitWindow;
            }
            if (this.rateLimit.count >= this.rateLimitMax) {
                console.warn("Rate limit exceeded for Gemini API");
                throw new Error("Rate limit exceeded. Please try again later.");
            }
            // Generate cache key
            const cacheKey = crypto_1.default.createHash("md5").update(prompt).digest("hex");
            // Check cache
            if (this.cache.has(cacheKey)) {
                const entry = this.cache.get(cacheKey);
                if (Date.now() - entry.timestamp < this.cacheTTL) {
                    console.log("Gemini cache hit for prompt hash:", cacheKey);
                    return entry.data;
                }
                else {
                    this.cache.delete(cacheKey); // Remove expired entry
                }
            }
            // Increment rate limit counter
            this.rateLimit.count++;
            // Log request
            console.log("Making Gemini API request. Rate limit count:", this.rateLimit.count);
            try {
                // Prepare request with optional timeout
                const request = this.model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: (config === null || config === void 0 ? void 0 : config.maxOutputTokens) || 500,
                        temperature: (config === null || config === void 0 ? void 0 : config.temperature) || 0.3,
                        topP: (config === null || config === void 0 ? void 0 : config.topP) || 0.95,
                    },
                });
                let response;
                if (timeout) {
                    response = yield Promise.race([
                        request,
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini API timeout")), timeout)),
                    ]);
                }
                else {
                    response = yield request;
                }
                const text = response.response.text();
                // Cache the response
                this.cache.set(cacheKey, { data: text, timestamp: Date.now() });
                // Log success
                console.log("Gemini API request successful");
                return text;
            }
            catch (error) {
                // Log error
                console.error("Gemini API error:", error.message);
                throw new Error(`Gemini API failed: ${error.message}`);
            }
        });
    }
    // Method to get cache stats for monitoring
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
        };
    }
    // Method to get rate limit stats
    getRateLimitStats() {
        return {
            count: this.rateLimit.count,
            resetTime: this.rateLimit.resetTime,
            remaining: this.rateLimitMax - this.rateLimit.count,
        };
    }
    // Method to clear cache (for maintenance)
    clearCache() {
        this.cache.clear();
        console.log("Gemini cache cleared");
    }
}
exports.default = new GeminiService();
