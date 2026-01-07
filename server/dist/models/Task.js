"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PriorityLogSchema = new mongoose_1.Schema({
    oldPriority: {
        type: String,
        enum: ["Low", "Medium", "High", "Completed"],
        required: true,
    },
    newPriority: {
        type: String,
        enum: ["Low", "Medium", "High", "Completed"],
        required: true,
    },
    reason: { type: String, required: true },
    progress: { type: Number },
    timestamp: { type: Date, default: Date.now },
});
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High", "Completed"],
        default: "Medium",
        required: true,
    },
    previousPriority: { type: String },
    dueDate: { type: Date, required: true },
    dueTime: { type: Date },
    status: {
        type: String,
        enum: ["Pending", "In-progress", "Completed"],
        default: "Pending",
    },
    reminderTime: { type: Date },
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    retouchedByAI: { type: Boolean, default: false }, // Indicates if AI has modified the task
    priorityLogs: { type: [PriorityLogSchema], default: [] }, // Stores priority change history
    notificationSent: {
        type: Boolean,
        default: false,
    }, // Indicates if a reminder notification has been sent
}, { timestamps: true });
const Task = mongoose_1.default.model("Task", TaskSchema);
exports.default = Task;
