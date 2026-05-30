"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../middleware/rateLimiter");
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Apply stricter rate limiting to all auth routes
router.use(rateLimiter_1.authLimiter);
// Public auth routes with validation
router.post("/register", (0, validation_1.validate)(validation_1.registerSchema), authController_1.register);
router.post("/login", (0, validation_1.validate)(validation_1.loginSchema), authController_1.login);
router.post("/logout", authController_1.logout);
// Email verification
router.post("/verify-email", authController_1.verifyEmail);
router.post("/resend-verification", authController_1.resendVerification);
// Password reset
router.post("/forgot-password", (0, validation_1.validate)(validation_1.forgotPasswordSchema), authController_1.forgotPassword);
router.post("/reset-password", (0, validation_1.validate)(validation_1.resetPasswordSchema), authController_1.resetPassword);
exports.default = router;
