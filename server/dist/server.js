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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
require("dotenv/config");
const v8_1 = __importDefault(require("v8"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const googleAuthRoutes_1 = __importDefault(require("./routes/googleAuthRoutes"));
const nlp_1 = __importDefault(require("./routes/nlp"));
const prioritizeTasks_1 = __importDefault(require("./routes/prioritizeTasks"));
const taskAnalysis_1 = __importDefault(require("./routes/taskAnalysis"));
const insights_1 = __importDefault(require("./routes/insights"));
const db_1 = __importDefault(require("./config/db"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const TaskAnalysisScheduler_1 = require("./cron/TaskAnalysisScheduler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
// Set safe heap limit for Render's 512MB free tier (Node 22.4+)
try {
    (_b = (_a = v8_1.default).setHeapSizeLimit) === null || _b === void 0 ? void 0 : _b.call(_a, 384 * 1024 * 1024);
}
catch (_c) {
    // Fallback: rely on --max-old-space-size CLI flag
}
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const heap = () => v8_1.default.getHeapStatistics();
const logMem = (label) => console.log(`[mem] ${label}: heap=${mb(heap().used_heap_size)}/${mb(heap().heap_size_limit)} rss=${mb(process.memoryUsage().rss)}`);
logMem("server start");
// Security: Helmet for security headers
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false, // Allow embedding for OAuth popups
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: [
                "'self'",
                "https://generativelanguage.googleapis.com",
                "https://fcm.googleapis.com",
            ],
        },
    },
}));
// Apply general rate limiter to all routes
app.use(rateLimiter_1.generalLimiter);
// Middleware to parse JSON with size limit
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
// Enable CORS
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://taskwise-three.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});
exports.server = server;
const startBackgroundServices = () => __awaiter(void 0, void 0, void 0, function* () {
    logMem("before connectDB");
    try {
        yield (0, db_1.default)();
    }
    catch (error) {
        console.error("Failed to connect to database:", error);
        return;
    }
    logMem("after connectDB");
    try {
        yield Promise.resolve().then(() => __importStar(require("./cron/reminderCron")));
        console.log("[startup] reminderCron loaded");
    }
    catch (error) {
        console.error("Failed to load reminderCron:", error);
    }
    logMem("after reminderCron");
    try {
        yield Promise.resolve().then(() => __importStar(require("./cron/RecurrenceCron")));
        console.log("[startup] RecurrenceCron loaded");
    }
    catch (error) {
        console.error("Failed to load RecurrenceCron:", error);
    }
    logMem("after RecurrenceCron");
    try {
        yield TaskAnalysisScheduler_1.taskAnalysisScheduler.restoreSchedules();
    }
    catch (error) {
        console.error("Failed to restore task analysis schedules:", error);
    }
    logMem("startup complete");
});
void startBackgroundServices();
// Log memory every 30s for Render diagnostics
setInterval(() => logMem("periodic"), 30000);
exports.default = app;
