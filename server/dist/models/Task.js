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
// ========== SCHEMAS ==========
const SubtaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
});
const RecurrenceSchema = new mongoose_1.Schema({
    enabled: { type: Boolean, default: false },
    pattern: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
        default: "daily",
    },
    interval: { type: Number, default: 1, min: 1, max: 365 },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    endDate: { type: Date },
    nextOccurrence: { type: Date },
    lastGenerated: { type: Date },
});
const TimeTrackingSchema = new mongoose_1.Schema({
    estimatedMinutes: { type: Number, min: 0 },
    actualMinutes: { type: Number, default: 0, min: 0 },
    pomodoroSessions: { type: Number, default: 0, min: 0 },
});
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
    timestamp: { type: Date, default: Date.now },
});
const TaskSchema = new mongoose_1.Schema({
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
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
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true, index: true },
    retouchedByAI: { type: Boolean, default: false },
    priorityLogs: { type: [PriorityLogSchema], default: [] },
    notificationSent: { type: Boolean, default: false },
    // New fields
    tags: { type: [String], default: [], maxlength: 10 },
    category: {
        type: String,
        maxlength: 50,
        enum: [
            "Work",
            "Personal",
            "Health",
            "Learning",
            "Finance",
            "Social",
            "Other",
            null,
        ],
    },
    subtasks: { type: [SubtaskSchema], default: [] },
    recurrence: { type: RecurrenceSchema },
    timeTracking: {
        type: TimeTrackingSchema,
        default: () => ({ actualMinutes: 0, pomodoroSessions: 0 }),
    },
    parentTaskId: { type: mongoose_1.Types.ObjectId, ref: "Task" },
    isRecurrenceInstance: { type: Boolean, default: false },
}, { timestamps: true });
// ========== INDEXES ==========
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, completed: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ userId: 1, category: 1 });
TaskSchema.index({ "recurrence.enabled": 1, "recurrence.nextOccurrence": 1 });
// ========== VIRTUALS ==========
TaskSchema.virtual("subtaskProgress").get(function () {
    if (!this.subtasks || this.subtasks.length === 0)
        return 100;
    const completed = this.subtasks.filter((s) => s.completed).length;
    return Math.round((completed / this.subtasks.length) * 100);
});
// ========== MIDDLEWARE ==========
// Auto-update progress when subtasks change
TaskSchema.pre("save", function (next) {
    if (this.isModified("subtasks") && Array.isArray(this.subtasks)) {
        const subtasks = this.subtasks;
        if (subtasks.length > 0) {
            const completedCount = subtasks.filter((s) => s.completed).length;
            // If all subtasks done, mark parent as completed
            if (completedCount === subtasks.length && subtasks.length > 0) {
                this.completed = true;
                this.status = "Completed";
                this.priority = "Completed";
            }
        }
    }
    next();
});
const Task = mongoose_1.default.model("Task", TaskSchema);
exports.default = Task;
