import { authenticateUser } from "../middleware/authMiddleware";
import express, { Request, Response } from "express";
import { taskAnalysisScheduler } from "../cron/TaskAnalysisScheduler";

const router = express.Router();

router.post(
  "/enable-task-analysis",
  authenticateUser,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { firstRunTime } = req.body; // Expected format: "HH:mm"

    try {
      const schedule = await taskAnalysisScheduler.enableSchedulingForUser(
        userId
      );
      res.status(200).json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/disable-task-analysis",
  authenticateUser,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
      await taskAnalysisScheduler.disableSchedulingForUser(userId);
      res.status(200).json({ message: "Task analysis scheduling disabled" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
