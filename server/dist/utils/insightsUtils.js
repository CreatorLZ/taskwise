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
function generateProductivityInsights(userId, userName) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = yield Task_1.default.find({ userId });
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
        const response = yield geminiService_1.default.generateContent(prompt, {
            maxOutputTokens: 300,
            temperature: 0.7,
        });
        // Extract JSON from response
        const output = response;
        try {
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return {
                productivityInsight: "No insight generated.",
                taskOptimizationInsight: "No suggestion generated.",
            };
        }
        catch (_a) {
            return {
                productivityInsight: "No insight generated.",
                taskOptimizationInsight: "No suggestion generated.",
            };
        }
    });
}
