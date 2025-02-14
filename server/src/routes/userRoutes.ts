// routes/userRoutes.ts
import express from "express";
import { authenticateUser } from "../middleware/authMiddleware";
import User from "../models/User";
import { Request, Response } from "express";

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

router.put(
  "/update-fcm-token",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { userId, fcmToken } = (req as any).body;

      // Update the user's FCM token
      await User.findByIdAndUpdate(userId, { fcmToken });

      res.json({ message: "FCM token updated successfully" });
    } catch (error) {
      console.error("Error updating FCM token:", error);
      res.status(500).json({ message: "Error updating FCM token" });
    }
  }
);

export default router;
