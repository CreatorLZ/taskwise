import { Router } from "express";
import { authLimiter } from "../middleware/rateLimiter";
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../middleware/validation";

const router = Router();

// Apply stricter rate limiting to all auth routes
router.use(authLimiter);

// Public auth routes with validation
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password reset
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
