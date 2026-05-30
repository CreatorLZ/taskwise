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
exports.analyzeAndPrioritizeTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const geminiService_1 = __importDefault(require("../services/geminiService"));
const calculateTimeProgress_1 = __importDefault(require("./calculateTimeProgress"));
const aiJsonUtils_1 = require("./aiJsonUtils");
const date_fns_1 = require("date-fns");
const VALID_PRIORITIES = ["Low", "Medium", "High", "Completed"];
const VALID_STATUSES = ["Pending", "In-progress", "Completed"];
const isPriority = (value) => VALID_PRIORITIES.includes(value);
const isStatus = (value) => VALID_STATUSES.includes(value);
const taskId = (task) => String(task._id);
const formatTaskForClient = (task) => {
    var _a;
    const createdAt = (_a = task.createdAt) !== null && _a !== void 0 ? _a : new Date();
    return Object.assign(Object.assign({}, task.toObject()), { dueDate: task.dueDate.toISOString(), dueTime: (0, date_fns_1.formatDistanceToNow)(new Date(task.dueDate), {
            addSuffix: true,
        }), formattedDueDate: (0, date_fns_1.format)(new Date(task.dueDate), "MMM d, yyyy h:mm a"), startDate: (0, date_fns_1.format)(new Date(createdAt), "yyyy-MM-dd"), progress: (0, calculateTimeProgress_1.default)(createdAt.toISOString(), task.dueDate.toISOString()) });
};
const getFallbackRecommendation = (task, referenceDate) => {
    if (task.completed || task.status === "Completed") {
        return {
            taskId: taskId(task),
            newPriority: "Completed",
            newStatus: "Completed",
            reason: "Task is already completed.",
        };
    }
    const msUntilDue = task.dueDate.getTime() - referenceDate.getTime();
    const hoursUntilDue = msUntilDue / (1000 * 60 * 60);
    if (hoursUntilDue < 0) {
        return {
            taskId: taskId(task),
            newPriority: "High",
            newStatus: "Pending",
            reason: "Task is overdue.",
        };
    }
    if (hoursUntilDue <= 24) {
        return {
            taskId: taskId(task),
            newPriority: "High",
            newStatus: task.status === "Completed" ? "Completed" : "In-progress",
            reason: "Task is due within 24 hours.",
        };
    }
    if (hoursUntilDue <= 72) {
        return {
            taskId: taskId(task),
            newPriority: "Medium",
            newStatus: task.status === "Completed" ? "Completed" : "Pending",
            reason: "Task is due within the next three days.",
        };
    }
    return {
        taskId: taskId(task),
        newPriority: "Low",
        newStatus: task.status === "Completed" ? "Completed" : "Pending",
        reason: "Task has enough lead time.",
    };
};
const getAiRecommendations = (tasks, referenceDate) => __awaiter(void 0, void 0, void 0, function* () {
    const prompt = `Return a JSON array only. No markdown. No prose.

Reference date: ${referenceDate.toISOString()}

Rules:
- Preserve Completed tasks as Completed.
- Overdue tasks should usually be High priority and Pending unless completed.
- Tasks due within 24 hours should usually be High priority.
- Tasks due within 3 days should usually be Medium priority.
- Use Low priority only when there is enough lead time and no urgency.
- Return one recommendation per task.

Each array item must use this shape:
{
  "taskId": "string",
  "newPriority": "Low" | "Medium" | "High" | "Completed",
  "newStatus": "Pending" | "In-progress" | "Completed",
  "reason": "short practical reason"
}

Tasks:
${JSON.stringify(tasks.map((task) => {
        var _a;
        return ({
            taskId: taskId(task),
            title: task.title,
            priority: task.priority,
            status: task.status,
            completed: task.completed,
            dueDate: task.dueDate.toISOString(),
            createdAt: (_a = task.createdAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
        });
    }), null, 2)}`;
    const output = yield geminiService_1.default.generateContent(prompt, {
        maxOutputTokens: 4096,
        temperature: 0,
        topP: 0.9,
        responseMimeType: "application/json",
        thinkingLevel: "low",
    }, 15000);
    const parsed = (0, aiJsonUtils_1.parseJsonArray)(output);
    return parsed.filter((item) => typeof item.taskId === "string" &&
        isPriority(item.newPriority) &&
        isStatus(item.newStatus) &&
        typeof item.reason === "string");
});
const applyRecommendations = (tasks, recommendations) => __awaiter(void 0, void 0, void 0, function* () {
    const recommendationsByTaskId = new Map(recommendations.map((recommendation) => [
        recommendation.taskId,
        recommendation,
    ]));
    for (const task of tasks) {
        const recommendation = recommendationsByTaskId.get(taskId(task));
        if (!recommendation)
            continue;
        let isUpdated = false;
        if (recommendation.newPriority !== task.priority) {
            task.priorityLogs.push({
                oldPriority: task.priority,
                newPriority: recommendation.newPriority,
                reason: recommendation.reason,
                timestamp: new Date(),
            });
            task.previousPriority = task.priority;
            task.priority = recommendation.newPriority;
            isUpdated = true;
        }
        if (recommendation.newStatus !== task.status) {
            task.status = recommendation.newStatus;
            isUpdated = true;
        }
        if (recommendation.newStatus === "Completed") {
            task.completed = true;
        }
        if (isUpdated) {
            task.retouchedByAI = true;
            yield task.save();
        }
    }
});
const analyzeAndPrioritizeTasks = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new Error("userId is required but was not provided.");
    }
    const referenceDate = new Date();
    const tasks = yield Task_1.default.find({ userId, completed: false })
        .sort({ dueDate: 1, createdAt: 1 })
        .limit(10);
    if (tasks.length === 0) {
        return [];
    }
    let recommendations;
    try {
        recommendations = yield getAiRecommendations(tasks, referenceDate);
        if (recommendations.length === 0) {
            throw new Error("AI returned no valid task recommendations");
        }
    }
    catch (error) {
        if (error instanceof aiJsonUtils_1.AiJsonParseError) {
            console.warn("[AI prioritization] Invalid JSON response from Gemini", {
                message: error.message,
                responsePreview: error.responsePreview,
            });
        }
        console.warn("AI prioritization failed. Falling back to deterministic prioritization:", error.message);
        recommendations = tasks.map((task) => getFallbackRecommendation(task, referenceDate));
    }
    yield applyRecommendations(tasks, recommendations);
    const updatedTasks = yield Task_1.default.find({ userId }).sort({
        createdAt: -1,
        priority: -1,
        dueDate: 1,
    });
    return updatedTasks.map(formatTaskForClient);
});
exports.analyzeAndPrioritizeTasks = analyzeAndPrioritizeTasks;
