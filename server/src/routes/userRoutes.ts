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

      // Update the user's FCM token and return the updated user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { fcmToken },
        { new: true } // This option returns the updated document
      );

      res.json({
        message: "FCM token updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating FCM token:", error);
      res.status(500).json({ message: "Error updating FCM token" });
    }
  }
);

export default router;
