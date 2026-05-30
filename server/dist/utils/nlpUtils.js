"use strict";
// This file contains the function to create a task from a command using Gemini API.
// It includes error handling and JSON parsing logic.
// Uses centralized Gemini service for caching, rate limiting, and monitoring.
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
exports.createTaskFromNLP = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const geminiService_1 = __importDefault(require("../services/geminiService"));
const aiJsonUtils_1 = require("./aiJsonUtils");
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_STATUSES = ["Pending", "In-progress", "Completed"];
const createTaskFromNLP = (command, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new Error("userId is required but was not provided");
    }
    const currentDate = new Date();
    const currentDateISO = currentDate.toISOString();
    const prompt = `You are a task parsing assistant. Convert this command into a JSON task object. Return ONLY valid JSON without any explanation or additional text.

Command: ${command}

Current date/time reference: ${currentDateISO}

JSON format (all fields required):
{
  "title": "clear, concise title",
  "description": "detailed description of the task",
  "completed": false,
  "priority": "Low" | "Medium" | "High",
  "dueDate": "ISO 8601 date string",
  "status": "Pending",
  "reminderTime": "ISO 8601 date string (1 hour before dueDate)",
  "userId": "${userId}"
}

TIME HANDLING RULES:
1. For specific times (e.g., "7pm", "10:30am"), use EXACTLY that time
2. For vague time references, use these defaults:
   - "morning" or "early" → 09:00
   - "noon" or "midday" → 12:00
   - "afternoon" → 14:00 (2pm)
   - "evening" → 18:00 (6pm)
   - "night" or "tonight" → 21:00 (9pm)
   - "end of day" or no time specified → 23:59
3. For relative dates:
   - "today" → use current date
   - "tomorrow" → next day
   - "next week" → 7 days from now
4. Do NOT adjust timezones - output times as-is
5. Always output complete, valid JSON with all fields`;
    try {
        // Gemini API call with timeout using centralized service
        const output = yield geminiService_1.default.generateContent(prompt, {
            maxOutputTokens: 1500, // Increased further to prevent any truncation
            temperature: 0,
            topP: 0.9,
            responseMimeType: "application/json",
            thinkingLevel: "low",
        }, 20000);
        console.log("Model response:", output);
        const structuredTask = (0, aiJsonUtils_1.parseJsonObject)(output);
        return yield createTaskFromData(structuredTask, userId, currentDate);
    }
    catch (error) {
        if (error instanceof aiJsonUtils_1.AiJsonParseError) {
            console.warn("[AI NLP] Invalid JSON response from Gemini", {
                message: error.message,
                responsePreview: error.responsePreview,
            });
        }
        console.warn("NLP AI task parsing failed. Falling back to deterministic parser:", error.message);
        return yield createFallbackTask(command, userId, currentDate);
    }
});
exports.createTaskFromNLP = createTaskFromNLP;
const createTaskFromData = (structuredTask, userId, currentDate) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedDueDate = new Date(structuredTask.dueDate);
    if (isNaN(parsedDueDate.getTime())) {
        throw new Error("Invalid dueDate format");
    }
    const priority = VALID_PRIORITIES.includes(structuredTask.priority)
        ? structuredTask.priority
        : "Medium";
    const status = VALID_STATUSES.includes(structuredTask.status)
        ? structuredTask.status
        : "Pending";
    const taskData = {
        title: structuredTask.title || "Untitled Task",
        description: structuredTask.description || "",
        completed: false,
        priority,
        dueDate: parsedDueDate,
        status,
        reminderTime: structuredTask.reminderTime
            ? new Date(structuredTask.reminderTime)
            : new Date(parsedDueDate.getTime() - 10 * 60 * 1000),
        userId: userId,
    };
    if (taskData.dueDate < currentDate) {
        throw new Error("dueDate cannot be in the past");
    }
    return yield Task_1.default.create(taskData);
});
const createFallbackTask = (command, userId, currentDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dueDate = parseDueDateFromCommand(command, currentDate);
    const title = normalizeFallbackTitle(command);
    return yield Task_1.default.create({
        title,
        description: "Created without AI parsing because the AI service was unavailable.",
        completed: false,
        priority: inferPriority(command),
        dueDate,
        status: "Pending",
        reminderTime: new Date(dueDate.getTime() - 10 * 60 * 1000),
        userId,
    });
});
const normalizeFallbackTitle = (command) => {
    const cleaned = command
        .replace(/^create a task to\s+/i, "")
        .replace(/^remind me to\s+/i, "")
        .trim();
    return cleaned.length > 0 ? cleaned.slice(0, 200) : "Untitled Task";
};
const inferPriority = (command) => {
    const lower = command.toLowerCase();
    if (/\b(urgent|asap|important|critical|high priority)\b/.test(lower)) {
        return "High";
    }
    if (/\b(low priority|whenever|sometime)\b/.test(lower)) {
        return "Low";
    }
    return "Medium";
};
const parseDueDateFromCommand = (command, currentDate) => {
    const lower = command.toLowerCase();
    const dueDate = new Date(currentDate);
    if (lower.includes("tomorrow")) {
        dueDate.setDate(dueDate.getDate() + 1);
    }
    else if (lower.includes("next week")) {
        dueDate.setDate(dueDate.getDate() + 7);
    }
    else if (!lower.includes("today")) {
        dueDate.setDate(dueDate.getDate() + 1);
    }
    const explicitTime = parseTime(lower);
    if (explicitTime) {
        dueDate.setHours(explicitTime.hours, explicitTime.minutes, 0, 0);
    }
    else if (lower.includes("morning") || lower.includes("early")) {
        dueDate.setHours(9, 0, 0, 0);
    }
    else if (lower.includes("noon") || lower.includes("midday")) {
        dueDate.setHours(12, 0, 0, 0);
    }
    else if (lower.includes("afternoon")) {
        dueDate.setHours(14, 0, 0, 0);
    }
    else if (lower.includes("evening")) {
        dueDate.setHours(18, 0, 0, 0);
    }
    else if (lower.includes("night") || lower.includes("tonight")) {
        dueDate.setHours(21, 0, 0, 0);
    }
    else {
        dueDate.setHours(23, 59, 0, 0);
    }
    if (dueDate <= currentDate) {
        dueDate.setDate(dueDate.getDate() + 1);
    }
    return dueDate;
};
const parseTime = (text) => {
    const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (!match)
        return null;
    let hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const meridiem = match[3];
    if (hours > 23 || minutes > 59)
        return null;
    if (meridiem === "pm" && hours < 12) {
        hours += 12;
    }
    if (meridiem === "am" && hours === 12) {
        hours = 0;
    }
    return { hours, minutes };
};
