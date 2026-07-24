import "dotenv/config";
import v8 from "v8";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import googleAuthRoutes from "./routes/googleAuthRoutes";
import nlpRoutes from "./routes/nlp";
import prioritizeTasks from "./routes/prioritizeTasks";
import taskAnalysis from "./routes/taskAnalysis";
import insights from "./routes/insights";
import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";
import { taskAnalysisScheduler } from "./cron/TaskAnalysisScheduler";
import { generalLimiter, aiLimiter } from "./middleware/rateLimiter";

const app: Application = express();
const port = Number(process.env.PORT) || 5000;

// Set safe heap limit for Render's 512MB free tier (Node 22.4+)
try {
  (v8 as any).setHeapSizeLimit?.(384 * 1024 * 1024);
} catch {
  // Fallback: rely on --max-old-space-size CLI flag
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const heap = () => v8.getHeapStatistics();
const logMem = (label: string) =>
  console.log(
    `[mem] ${label}: heap=${mb(heap().used_heap_size)}/${mb(heap().heap_size_limit)} rss=${mb(process.memoryUsage().rss)}`
  );

logMem("server start");

// Security: Helmet for security headers
app.use(
  helmet({
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
  })
);

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Middleware to parse JSON with size limit
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://taskwise-three.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Set COOP and CORP headers
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  next();
});

// Register the routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", nlpRoutes);
app.use("/api", prioritizeTasks);
app.use("/api", taskAnalysis);
app.use("/api", insights);
app.use("/api/users", userRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Taskwise API is running");
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Server is running");
});

// Start the server
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

const startBackgroundServices = async () => {
  logMem("before connectDB");
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return;
  }
  logMem("after connectDB");

  try {
    await import("./cron/reminderCron");
    console.log("[startup] reminderCron loaded");
  } catch (error) {
    console.error("Failed to load reminderCron:", error);
  }
  logMem("after reminderCron");

  try {
    await import("./cron/RecurrenceCron");
    console.log("[startup] RecurrenceCron loaded");
  } catch (error) {
    console.error("Failed to load RecurrenceCron:", error);
  }
  logMem("after RecurrenceCron");

  try {
    await taskAnalysisScheduler.restoreSchedules();
  } catch (error) {
    console.error("Failed to restore task analysis schedules:", error);
  }

  logMem("startup complete");
};

void startBackgroundServices();

// Log memory every 30s for Render diagnostics
setInterval(() => logMem("periodic"), 30_000);

export default app;
export { server };
