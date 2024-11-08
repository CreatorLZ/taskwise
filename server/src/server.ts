import express, { Application, Request, Response } from "express";
import { config } from "dotenv";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import connectDB from "./config/db";

// Load environment variables
config();
// Connect to MongoDB
connectDB();

const app: Application = express();
const port = process.env.PORT;

// Middleware to parse JSON
app.use(express.json());

// Register the routes
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// root route
app.get("/", (req: Request, res: Response) => {
  res.send("Taskwise API is running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
