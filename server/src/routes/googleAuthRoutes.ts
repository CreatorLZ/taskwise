import { Router } from "express";
import {
  googleLogin,
  googleCallback,
} from "../controllers/googleAuthController";

const router = Router();

// Google authentication routes
router.post("/google", googleLogin);
router.post("/google/callback", googleCallback);

export default router;
