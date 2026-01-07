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
exports.taskAnalysisScheduler = exports.TaskAnalysisScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const analyzeAndPrioritizeTasks_1 = require("../utils/analyzeAndPrioritizeTasks");
class TaskAnalysisScheduler {
    constructor() {
        this.schedules = new Map();
    }
    enableSchedulingForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Check if scheduling is already enabled in the database
            const user = yield User_1.default.findById(userId);
            if ((_a = user === null || user === void 0 ? void 0 : user.taskAnalysisSchedule) === null || _a === void 0 ? void 0 : _a.enabled) {
                // Scheduling already enabled, do not re-enable or re-run analysis
                return {
                    firstRunTime: user.taskAnalysisSchedule.firstRunTime,
                    secondRunTime: user.taskAnalysisSchedule.secondRunTime,
                };
            }
            // Get current time and format it as HH:mm
            const now = new Date();
            const firstRunTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            // Calculate second run time (12 hours later)
            const secondRunTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
            const secondRunTimeStr = `${String(secondRunTime.getHours()).padStart(2, "0")}:${String(secondRunTime.getMinutes()).padStart(2, "0")}`;
            // Save schedule configuration to user model
            yield User_1.default.findByIdAndUpdate(userId, {
                taskAnalysisSchedule: {
                    firstRunTime,
                    secondRunTime: secondRunTimeStr,
                    enabled: true,
                },
            });
            // Create cron schedules
            const schedules = [
                node_cron_1.default.schedule(`${now.getMinutes()} ${now.getHours()} * * *`, () => {
                    (0, analyzeAndPrioritizeTasks_1.analyzeAndPrioritizeTasks)(userId);
                }),
                node_cron_1.default.schedule(`${secondRunTime.getMinutes()} ${secondRunTime.getHours()} * * *`, () => {
                    (0, analyzeAndPrioritizeTasks_1.analyzeAndPrioritizeTasks)(userId);
                }),
            ];
            // Store schedules in memory
            this.schedules.set(userId, schedules);
            // Run initial analysis immediately
            yield (0, analyzeAndPrioritizeTasks_1.analyzeAndPrioritizeTasks)(userId);
            return {
                firstRunTime,
                secondRunTime: secondRunTimeStr,
            };
        });
    }
    disableSchedulingForUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userSchedules = this.schedules.get(userId);
            if (userSchedules) {
                // Stop all schedules
                userSchedules.forEach((schedule) => schedule.stop());
                this.schedules.delete(userId);
                // Update user model
                yield User_1.default.findByIdAndUpdate(userId, {
                    "taskAnalysisSchedule.enabled": false,
                });
            }
        });
    }
    restoreSchedules() {
        return __awaiter(this, void 0, void 0, function* () {
            // Restore schedules from database on server restart
            // Only schedule for users who have never enabled scheduling before (should be none on restart)
            // Do not re-run analysis for already enabled users
            // This function is now a no-op to prevent unnecessary Gemini requests
            return;
        });
    }
}
exports.TaskAnalysisScheduler = TaskAnalysisScheduler;
// Create singleton instance
exports.taskAnalysisScheduler = new TaskAnalysisScheduler();
