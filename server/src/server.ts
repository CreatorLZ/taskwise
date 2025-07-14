import express, { Application, Request, Response } from "express";
import cors from "cors"; // Import CORS middleware
import { config } from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import googleAuthRoutes from "./routes/googleAuthRoutes";
import nlpRoutes from "./routes/nlp";
import prioritizeTasks from "./routes/prioritizeTasks";
import taskAnalysis from "./routes/taskAnalysis";
import connectDB from "./config/db";
import userRoutes from "./routes/userRoutes";
import "./cron/reminderCron";
import { taskAnalysisScheduler } from "./cron/TaskAnalysisScheduler";

// Load environment variables
config();

// Connect to MongoDB
connectDB();

const app: Application = express();
const port = process.env.PORT;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://taskwise-three.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
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

// const startServer = async () => {
//   await taskAnalysisScheduler.restoreSchedules();
// };

// startServer();

export default app;
