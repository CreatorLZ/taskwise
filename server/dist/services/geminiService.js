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
exports.GeminiServiceError = void 0;
const generative_ai_1 = require("@google/generative-ai");
const crypto_1 = __importDefault(require("crypto"));
class GeminiServiceError extends Error {
    constructor(message, diagnostics) {
        super(message);
        this.name = "GeminiServiceError";
        this.diagnostics = diagnostics;
    }
}
exports.GeminiServiceError = GeminiServiceError;
class GeminiService {
    constructor() {
        this.cacheTTL = 3600000;
        this.maxCacheSize = 1000; // Prevent memory leaks
        this.rateLimitMax = 10;
        this.rateLimitWindow = 60000;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey)
            throw new Error("GEMINI_API_KEY is not set");
        this.modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
        this.genai = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genai.getGenerativeModel({ model: this.modelName });
        this.cache = new Map();
        this.rateLimit = { count: 0, resetTime: Date.now() + this.rateLimitWindow };
    }
    generateContent(prompt_1) {
        return __awaiter(this, arguments, void 0, function* (prompt, config = {}, // Default empty object
        timeout = 30000 // Default 30s timeout
        ) {
            var _a, _b, _c, _d;
            this.checkRateLimit();
            // 1. Improved Cache Key (Includes Config)
            const cacheKey = this.generateCacheKey(prompt, config);
            // 2. Cache Check
            const cached = this.getFromCache(cacheKey);
            if (cached)
                return cached;
            this.incrementRateLimit();
            // 3. Setup AbortController for true cancellation
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const requestId = crypto_1.default.randomUUID();
            const startedAt = Date.now();
            try {
                console.log(`[Gemini] request ${requestId} started model=${this.modelName}`);
                const generationConfig = {
                    maxOutputTokens: config.maxOutputTokens || 500,
                    temperature: (_a = config.temperature) !== null && _a !== void 0 ? _a : 0.3,
                    topP: config.topP || 0.95,
                    responseMimeType: config.responseMimeType,
                };
                if (typeof config.thinkingLevel === "string") {
                    generationConfig.thinkingConfig = {
                        thinkingLevel: config.thinkingLevel,
                    };
                }
                else if (typeof config.thinkingBudget === "number") {
                    generationConfig.thinkingConfig = {
                        thinkingBudget: config.thinkingBudget,
                    };
                }
                const result = yield this.model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig,
                }, 
                // Pass the request options (supported in newer SDK versions)
                // Note: If your SDK version doesn't support requestOptions,
                // you will need to rely on the Promise.race method, but usually
                // 'fetch' based SDKs support signals implicitly or explicitly.
                // @ts-ignore - Ignoring TS check if SDK types are older
                { signal: controller.signal });
                clearTimeout(timeoutId);
                const durationMs = Date.now() - startedAt;
                // 4. Handle Safety Blocks
                const response = result.response;
                const firstCandidate = (_b = response.candidates) === null || _b === void 0 ? void 0 : _b[0];
                const diagnostics = {
                    requestId,
                    model: this.modelName,
                    durationMs,
                    finishReason: firstCandidate === null || firstCandidate === void 0 ? void 0 : firstCandidate.finishReason,
                    safetyRatings: firstCandidate === null || firstCandidate === void 0 ? void 0 : firstCandidate.safetyRatings,
                };
                if (!response.candidates || response.candidates.length === 0) {
                    const blockReason = (_c = response.promptFeedback) === null || _c === void 0 ? void 0 : _c.blockReason;
                    this.logGeminiFailure("No candidates returned", Object.assign(Object.assign({}, diagnostics), { blockReason }));
                    throw new GeminiServiceError(blockReason
                        ? `No candidates returned. Prompt blocked: ${blockReason}`
                        : "No candidates returned. Possible safety block.", Object.assign(Object.assign({}, diagnostics), { blockReason }));
                }
                const text = response.text();
                console.log(`[Gemini] request ${requestId} completed durationMs=${durationMs} finishReason=${(firstCandidate === null || firstCandidate === void 0 ? void 0 : firstCandidate.finishReason) || "unknown"} textLength=${text.length}`);
                this.setCache(cacheKey, text);
                return text;
            }
            catch (error) {
                clearTimeout(timeoutId);
                const durationMs = Date.now() - startedAt;
                if (error.name === "AbortError" || ((_d = error.message) === null || _d === void 0 ? void 0 : _d.includes("aborted"))) {
                    const timeoutError = new GeminiServiceError(`Gemini API request timed out after ${timeout}ms`, {
                        requestId,
                        model: this.modelName,
                        durationMs,
                    });
                    this.logGeminiFailure(timeoutError.message, timeoutError.diagnostics);
                    throw timeoutError;
                }
                if (error instanceof GeminiServiceError) {
                    throw error;
                }
                const message = (error === null || error === void 0 ? void 0 : error.message) || (error === null || error === void 0 ? void 0 : error.statusText) || "Unknown Gemini API error";
                const serviceError = new GeminiServiceError(message, {
                    requestId,
                    model: this.modelName,
                    durationMs,
                });
                this.logGeminiFailure(message, serviceError.diagnostics, error);
                throw serviceError;
            }
        });
    }
    generateCacheKey(prompt, config) {
        // Hash prompt + config to ensure unique keys for different settings
        const data = JSON.stringify({ prompt, config });
        return crypto_1.default.createHash("md5").update(data).digest("hex");
    }
    getFromCache(key) {
        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            if (Date.now() - entry.timestamp < this.cacheTTL) {
                console.log("Cache hit");
                return entry.data;
            }
            this.cache.delete(key);
        }
        return null;
    }
    setCache(key, data) {
        // 5. Memory Leak Protection (Simple LRU-ish behavior)
        if (this.cache.size >= this.maxCacheSize) {
            // Delete the first inserted key (oldest in a JS Map)
            const firstKey = this.cache.keys().next().value;
            if (firstKey)
                this.cache.delete(firstKey);
        }
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    checkRateLimit() {
        const now = Date.now();
        if (now > this.rateLimit.resetTime) {
            this.rateLimit.count = 0;
            this.rateLimit.resetTime = now + this.rateLimitWindow;
        }
        if (this.rateLimit.count >= this.rateLimitMax) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }
    }
    incrementRateLimit() {
        this.rateLimit.count++;
    }
    logGeminiFailure(message, diagnostics, rawError) {
        console.error("[Gemini] request failed", {
            message,
            diagnostics,
            rawError: rawError instanceof Error
                ? {
                    name: rawError.name,
                    message: rawError.message,
                    stack: process.env.NODE_ENV === "development"
                        ? rawError.stack
                        : undefined,
                }
                : rawError,
        });
    }
}
exports.default = new GeminiService();
