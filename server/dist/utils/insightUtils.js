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
exports.generateProductivityInsights = generateProductivityInsights;
const geminiService_1 = __importDefault(require("../services/geminiService"));
const Task_1 = __importDefault(require("../models/Task"));
function generateProductivityInsights(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = yield Task_1.default.find({ userId });
        const prompt = `
Analyze the following user's tasks and provide:
1. A personalized productivity insight (e.g., best time of day, work pattern, etc.)
2. A task optimization suggestion (e.g., break down tasks, focus area, etc.)
Return ONLY a JSON object:
{
  "productivityInsight": "...",
  "taskOptimization": "..."
}
Tasks: ${JSON.stringify(tasks.map((t) => ({
            title: t.title,
            description: t.description,
            dueDate: t.dueDate,
            completed: t.completed,
            priority: t.priority,
            status: t.status,
        })))}
`;
        const response = yield geminiService_1.default.generateContent(prompt, {
            maxOutputTokens: 300,
            temperature: 0.7,
            topP: 0.95,
        });
        // Try to extract JSON from the response
        const output = response;
        try {
            return JSON.parse(output.trim());
        }
        catch (_a) {
            // Fallback: extract JSON substring
            const jsonStart = output.indexOf("{");
            const jsonEnd = output.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd >= 0) {
                return JSON.parse(output.substring(jsonStart, jsonEnd + 1));
            }
            throw new Error("Failed to parse Gemini insight response");
        }
    });
}
