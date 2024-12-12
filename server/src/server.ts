import express, { Application, Request, Response } from "express";
import cors from "cors"; // Import CORS middleware
import { config } from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import nlpRoutes from "./routes/nlp";
import prioritizeTasks from "./routes/prioritizeTasks";
import connectDB from "./config/db";

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
    origin: "http://localhost:5173", // Allow requests from the frontend
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    credentials: true, // Allow credentials (if required)
  })
);

// Register the routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", nlpRoutes);
app.use("/api", prioritizeTasks);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Taskwise API is running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
