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
exports.generateAIPoweredUserInsights = generateAIPoweredUserInsights;
const generative_ai_1 = require("@google/generative-ai");
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const genai = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-2.0-flash" });
function computeUserHabitMetrics(tasks) {
    // Calculate metrics for user habits
    const completedTasks = tasks.filter((t) => t.completed);
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
    const overdueTasks = tasks.filter((t) => !t.completed && new Date(t.dueDate) < new Date());
    const overdueRate = totalTasks > 0 ? overdueTasks.length / totalTasks : 0;
    const streak = computeCompletionStreak(completedTasks);
    const mostProductiveHour = getMostProductiveHour(completedTasks);
    return {
        completionRate,
        overdueRate,
        streak,
        mostProductiveHour,
        totalTasks,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
    };
}
function computeCompletionStreak(completedTasks) {
    // Calculate the current streak of days with at least one completed task
    const dates = completedTasks
        .map((t) => new Date(t.updatedAt).toDateString())
        .filter((v, i, a) => a.indexOf(v) === i) // unique days
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    let current = new Date();
    for (let i = 0; i < dates.length; i++) {
        if (new Date(dates[i]).toDateString() === current.toDateString()) {
            streak++;
            current.setDate(current.getDate() - 1);
        }
        else {
            break;
        }
    }
    return streak;
}
function getMostProductiveHour(completedTasks) {
    // Find the hour of day with most completed tasks
    const hours = Array(24).fill(0);
    completedTasks.forEach((t) => {
        const hour = new Date(t.updatedAt).getHours();
        hours[hour]++;
    });
    const max = Math.max(...hours);
    return hours.findIndex((h) => h === max);
}
function generateAIPoweredUserInsights(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield User_1.default.findById(userId);
        const tasks = yield Task_1.default.find({ userId });
        const habitMetrics = computeUserHabitMetrics(tasks);
        const prompt = `You are Taskwise, an advanced productivity assistant. Analyze the following user's task data and habit metrics, and provide:
1. A personalized productivity insight based on their habits (e.g., best time of day, completion streak, etc.)
2. A task optimization suggestion (e.g., how to improve completion, break bad habits, etc.)
3. A habit-based suggestion (e.g., "Try to complete tasks earlier in the day", "Maintain your current streak!", etc.)
Return ONLY a JSON object:
{
  "productivityInsight": "...",
  "taskOptimization": "...",
  "habitSuggestion": "..."
}
User: ${(user === null || user === void 0 ? void 0 : user.username) || "User"}
Metrics: ${JSON.stringify(habitMetrics, null, 2)}
Tasks: ${JSON.stringify(tasks.map((t) => ({
            title: t.title,
            completed: t.completed,
            dueDate: t.dueDate,
            updatedAt: t.updatedAt,
            priority: t.priority,
            status: t.status,
        })), null, 2)}
`;
        const response = yield model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 400,
                temperature: 0.7,
                topP: 0.95,
            },
        });
        const output = response.response.text();
        try {
            return JSON.parse(output.trim());
        }
        catch (_a) {
            const jsonStart = output.indexOf("{");
            const jsonEnd = output.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd >= 0) {
                return JSON.parse(output.substring(jsonStart, jsonEnd + 1));
            }
            throw new Error("Failed to parse Gemini insight response");
        }
    });
}
