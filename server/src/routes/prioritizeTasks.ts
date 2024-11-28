import express, { Request, Response } from "express";
import { analyzeAndPrioritizeTasks } from "../utils/analyzeAndPrioritizeTasks";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/prioritize-tasks",
  authenticateUser,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    try {
      const result = await analyzeAndPrioritizeTasks(userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
