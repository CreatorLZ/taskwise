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
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_1 = __importDefault(require("express"));
const TaskAnalysisScheduler_1 = require("../cron/TaskAnalysisScheduler");
const router = express_1.default.Router();
router.post("/enable-task-analysis", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { firstRunTime } = req.body; // Expected format: "HH:mm"
    try {
        const schedule = yield TaskAnalysisScheduler_1.taskAnalysisScheduler.enableSchedulingForUser(userId);
        res.status(200).json(schedule);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
router.post("/disable-task-analysis", authMiddleware_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    try {
        yield TaskAnalysisScheduler_1.taskAnalysisScheduler.disableSchedulingForUser(userId);
        res.status(200).json({ message: "Task analysis scheduling disabled" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
