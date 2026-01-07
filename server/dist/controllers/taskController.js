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
exports.markTaskAsCompleted = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.createTask = exports.getAllTasks = exports.getTasksByUserId = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const date_fns_1 = require("date-fns");
const calculateTimeProgress_1 = __importDefault(require("../utils/calculateTimeProgress"));
const mongoose_1 = __importDefault(require("mongoose"));
const calculateReminderTime = (dueDate) => {
    return new Date(dueDate.getTime() - 10 * 60000);
};
const validateAndParseDate = (dateString) => {
    const parsedDate = (0, date_fns_1.parseISO)(dateString);
    if (!(0, date_fns_1.isValid)(parsedDate)) {
        throw new Error("Invalid date format provided");
    }
    return parsedDate;
};
// Get all tasks for a specific user with formatted dueTime
exports.getTasksByUserId = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }
    const tasks = yield Task_1.default.find({ userId }).sort({
        createdAt: -1,
        priority: -1,
        dueDate: 1,
    });
    if (!tasks || tasks.length === 0) {
        return res.json({ message: "No tasks found for this user" });
    }
    const formattedTasks = tasks.map((task) => {
        var _a;
        const createdAt = (_a = task.createdAt) !== null && _a !== void 0 ? _a : new Date();
        const progress = (0, calculateTimeProgress_1.default)(createdAt.toISOString(), // Use createdAt as startDate
        task.dueDate.toISOString());
        return Object.assign(Object.assign({}, task.toObject()), { dueDate: task.dueDate.toISOString(), dueTime: (0, date_fns_1.formatDistanceToNow)(new Date(task.dueDate), {
                addSuffix: true,
            }), formattedDueDate: (0, date_fns_1.format)(new Date(task.dueDate), "MMM d, yyyy h:mm a"), startDate: (0, date_fns_1.format)(new Date(createdAt), "yyyy-MM-dd"), progress });
    });
    res.json(formattedTasks);
}));
// Get all tasks with sorting by priority and dueDate. this is a route for admins only . will update later
exports.getAllTasks = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tasks = yield Task_1.default.find().sort({ priority: -1, dueDate: 1 }); // -1 for descending priority, 1 for ascending dueDate
    res.json(tasks);
}));
//create a new task
exports.createTask = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const dueDate = new Date(req.body.dueDate);
    const reminderTime = calculateReminderTime(dueDate);
    const taskData = Object.assign(Object.assign({}, req.body), { userId: req.user.id, dueDate: dueDate, reminderTime: reminderTime, notificationSent: false });
    const task = yield Task_1.default.create(taskData);
    const createdAt = (_a = task.createdAt) !== null && _a !== void 0 ? _a : new Date();
    res.status(201).json(Object.assign(Object.assign({}, task.toObject()), { dueDate: task.dueDate, dueTime: (0, date_fns_1.formatDistanceToNow)(new Date(task.dueDate), {
            addSuffix: true,
        }), formattedDueDate: (0, date_fns_1.format)(task.dueDate, "MMM d, yyyy h:mm a"), startDate: (0, date_fns_1.format)(createdAt, "yyyy-MM-dd"), progress: (0, calculateTimeProgress_1.default)(createdAt.toISOString(), task.dueDate.toISOString()) }));
}));
// Get a specific task by ID
exports.getTaskById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield Task_1.default.findById(req.params.id);
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    res.json(task);
}));
// Update a task by ID
exports.updateTask = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let updates = Object.assign({}, req.body);
    // If due date is being updated, recalculate reminder time
    if (req.body.dueDate) {
        const dueDate = validateAndParseDate(req.body.dueDate);
        updates = Object.assign(Object.assign({}, updates), { dueDate, reminderTime: calculateReminderTime(dueDate), 
            // Reset notification flag when due date is updated
            notificationSent: false });
    }
    const task = yield Task_1.default.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    res.json(task);
}));
// Delete a task by ID
exports.deleteTask = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield Task_1.default.findByIdAndDelete(req.params.id);
    if (!task)
        return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
}));
// Mark a task as completed
exports.markTaskAsCompleted = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate the task ID
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
    }
    // Find and update the task
    const task = yield Task_1.default.findByIdAndUpdate(id, { completed: true, priority: "Completed" }, // Fields to update
    { new: true } // Return the updated document
    );
    // Handle task not found
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }
    // Send the updated task in the response
    res.json(task);
}));
