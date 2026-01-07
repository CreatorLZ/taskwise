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
const createTaskFromNLP = (command, userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate command and userId
    try {
        if (!userId) {
            throw new Error("userId is required but was not provided");
        }
        const currentDate = new Date();
        const currentDateISO = currentDate.toISOString();
        const prompt = `Convert this command into a JSON task object. Return ONLY valid JSON without any explanation or additional text:
Command: ${command}

JSON format:
{
  "title": "clear title",
  "description": "detailed description",
  "completed": false,
  "priority": "Medium",
  "dueDate": "ISO date string",
  "status": "Pending",
  "reminderTime": "ISO date string",
  "userId": "${userId}"
}

Important time handling instructions:
1. Use ${currentDateISO} as reference for today's date
2. For time, use the EXACT hour specified in the command (e.g., "7pm" should be 19:00, not 20:00)
3. Do NOT adjust or convert time zones - use the exact time as specified
4. If a specific time is mentioned (like "7pm" or "10:30"), use exactly that time
5. If no time is specified, default to 23:59 (end of day)`;
        // Gemini API call with timeout using centralized service
        const output = yield geminiService_1.default.generateContent(prompt, {
            maxOutputTokens: 300,
            temperature: 0.3,
            topP: 0.95,
        }, 15000);
        console.log("Model response:", output);
        // JSON parsing approach
        try {
            const structuredTask = JSON.parse(output.trim());
            const task = yield createTaskFromData(structuredTask, userId, currentDate);
            return task;
        }
        catch (error) {
            console.log("Direct JSON parsing failed, trying extraction...");
            const jsonStart = output.indexOf("{");
            const jsonEnd = output.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd >= 0) {
                try {
                    const jsonStr = output.substring(jsonStart, jsonEnd + 1);
                    const structuredTask = JSON.parse(jsonStr);
                    const task = yield createTaskFromData(structuredTask, userId, currentDate);
                    return task;
                }
                catch (innerError) {
                    console.error("Failed to parse extracted JSON");
                }
            }
            const jsonRegex = /\{[\s\S]*?\{[\s\S]*?\}[\s\S]*?\}/g;
            const matches = output.match(jsonRegex);
            if (!matches) {
                const simpleJsonRegex = /\{[\s\S]*?\}/g;
                const simpleMatches = output.match(simpleJsonRegex);
                if (!simpleMatches) {
                    throw new Error("No JSON object found in response");
                }
                const jsonStr = simpleMatches.reduce((a, b) => a.length > b.length ? a : b);
                try {
                    const structuredTask = JSON.parse(jsonStr);
                    const task = yield createTaskFromData(structuredTask, userId, currentDate);
                    return task;
                }
                catch (error) {
                    console.error("Failed to parse simple JSON match:", jsonStr);
                    throw new Error("Invalid JSON format in response");
                }
            }
            const jsonStr = matches.reduce((a, b) => (a.length > b.length ? a : b));
            try {
                const structuredTask = JSON.parse(jsonStr);
                const task = yield createTaskFromData(structuredTask, userId, currentDate);
                return task;
            }
            catch (error) {
                console.error("Failed to parse JSON:", jsonStr);
                throw new Error("Invalid JSON format in response");
            }
        }
    }
    catch (error) {
        console.error("Error creating task from NLP:", error);
        throw new Error(`Failed to process command: ${error.message}`);
    }
});
exports.createTaskFromNLP = createTaskFromNLP;
const createTaskFromData = (structuredTask, userId, currentDate) => __awaiter(void 0, void 0, void 0, function* () {
    // Replace 'any' with Task type isaac dont be lazy and stupid
    const parsedDueDate = new Date(structuredTask.dueDate);
    parsedDueDate.setHours(parsedDueDate.getHours() - 1);
    const taskData = {
        title: structuredTask.title || "Untitled Task",
        description: structuredTask.description,
        completed: false,
        priority: structuredTask.priority || "Medium",
        dueDate: parsedDueDate,
        status: structuredTask.status || "Pending",
        reminderTime: structuredTask.reminderTime
            ? new Date(structuredTask.reminderTime)
            : new Date(parsedDueDate.getTime() - 24 * 60 * 60 * 1000),
        userId: userId,
    };
    if (isNaN(taskData.dueDate.getTime())) {
        throw new Error("Invalid dueDate format");
    }
    if (taskData.dueDate < currentDate) {
        throw new Error("dueDate cannot be in the past");
    }
    return yield Task_1.default.create(taskData);
});
