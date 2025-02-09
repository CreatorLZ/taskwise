import express, { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { createTaskFromNLP } from "../utils/nlpUtils";
import { authenticateUser } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/create-from-nlp",
  authenticateUser,
  asyncHandler(async (req: Request, res: Response): Promise<void | any> => {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: "No command provided" });
    }

    // Add prefix to the command
    const prefixedCommand = `create a task to ${command}`;

    // Extract user ID
    const userId = (req as any).user.id;

    // Call the utility function and pass userId and command
    const createdTask = await createTaskFromNLP(prefixedCommand, userId);
    return res.status(201).json(createdTask);
  })
);

export default router;
