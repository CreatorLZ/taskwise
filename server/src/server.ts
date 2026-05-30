import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import googleAuthRoutes from "./routes/googleAuthRoutes";
import nlpRoutes from "./routes/nlp";
import prioritizeTasks from "./routes/prioritizeTasks";
import taskAnalysis from "./routes/taskAnalysis";
import insights from "./routes/insights";
import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";
import "./cron/reminderCron";
import "./cron/RecurrenceCron";
import { taskAnalysisScheduler } from "./cron/TaskAnalysisScheduler";
import { generalLimiter, aiLimiter } from "./middleware/rateLimiter";

// Load environment variables
config();

// Connect to MongoDB
connectDB();

const app: Application = express();
const port = process.env.PORT;

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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const startTaskShedulesServer = async () => {
  await taskAnalysisScheduler.restoreSchedules();
};

startTaskShedulesServer();

export default app;
