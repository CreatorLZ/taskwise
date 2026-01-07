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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const googleAuthRoutes_1 = __importDefault(require("./routes/googleAuthRoutes"));
const nlp_1 = __importDefault(require("./routes/nlp"));
const prioritizeTasks_1 = __importDefault(require("./routes/prioritizeTasks"));
const taskAnalysis_1 = __importDefault(require("./routes/taskAnalysis"));
const insights_1 = __importDefault(require("./routes/insights"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
require("./cron/reminderCron");
const TaskAnalysisScheduler_1 = require("./cron/TaskAnalysisScheduler");
// Load environment variables
(0, dotenv_1.config)();
// Connect to MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
const port = process.env.PORT;
// Middleware to parse JSON
app.use(express_1.default.json());
// Enable CORS
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://taskwise-three.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    credentials: true,
}));
// Set COOP and CORP headers
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
});
// Register the routes
app.use("/api/tasks", taskRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.use("/api/auth", googleAuthRoutes_1.default);
app.use("/api", nlp_1.default);
app.use("/api", prioritizeTasks_1.default);
app.use("/api", taskAnalysis_1.default);
app.use("/api", insights_1.default);
app.use("/api/users", userRoutes_1.default);
// Root route
app.get("/", (req, res) => {
    res.send("Taskwise API is running");
});
app.get("/health", (req, res) => {
    res.status(200).send("Server is running");
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
const startTaskShedulesServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield TaskAnalysisScheduler_1.taskAnalysisScheduler.restoreSchedules();
});
startTaskShedulesServer();
exports.default = app;
