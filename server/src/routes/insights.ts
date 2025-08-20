import express from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import { generateAIPoweredUserInsights } from "../utils/aiUserInsights";

const router = express.Router();

router.get("/insights", authenticateUser, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const insights = await generateAIPoweredUserInsights(userId);
    res.json(insights);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error.message || "Failed to generate insights" });
  }
});

export default router;
