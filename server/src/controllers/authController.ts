import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import securityService from "../services/securityService";
import emailService from "../services/emailService";

// ========== REGISTER ==========
export const register = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      securityService.logAudit({
        action: "REGISTER_FAILED",
        email,
        ip: req.ip,
        success: false,
        details: { reason: "Email already exists" },
      });
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      authProvider: "local",
      emailVerified: false,
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email (non-blocking)
    emailService
      .sendVerificationEmail(user.email, user.username, verificationToken)
      .catch((err) => console.error("Failed to send verification email:", err));

    securityService.logAudit({
      action: "REGISTER_SUCCESS",
      userId: user._id.toString(),
      email,
      ip: req.ip,
      success: true,
    });

    const token = generateToken(user._id.toString());
    res.status(201).json({
      token,
      message:
        "Registration successful. Please check your email to verify your account.",
      userId: user._id.toString(),
    });
  } catch (error: any) {
    securityService.logAudit({
      action: "REGISTER_ERROR",
      email: req.body.email,
      ip: req.ip,
      success: false,
      details: { error: error.message },
    });
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// ========== LOGIN ==========
export const login = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      securityService.logAudit({
        action: "LOGIN_FAILED",
        email: normalizedEmail,
        ip: req.ip,
        success: false,
        details: { reason: "User not found" },
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.authProvider === "google" && !user.password) {
      securityService.logAudit({
        action: "LOGIN_FAILED",
        userId: user._id.toString(),
        email: normalizedEmail,
        ip: req.ip,
        success: false,
        details: { reason: "Google account attempted password login" },
      });
      return res.status(400).json({
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const now = new Date();
      if (user.lockUntil && now < user.lockUntil) {
        const minutesRemaining = Math.ceil(
          (user.lockUntil.getTime() - now.getTime()) / (1000 * 60)
        );
        securityService.logAudit({
          action: "LOGIN_BLOCKED",
          userId: user._id.toString(),
          email: normalizedEmail,
          ip: req.ip,
          success: false,
          details: { reason: "Account locked", minutesRemaining },
        });
        return res.status(423).json({
          message: `Account is locked. Try again in ${minutesRemaining} minute(s).`,
        });
      }
      // Lock expired, reset
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Track failed attempt
      user.failedLoginAttempts += 1;
      const { shouldLock, attemptCount } =
        securityService.trackFailedAttempt(normalizedEmail);

      if (shouldLock || user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockUntil = securityService.calculateLockUntil();
        await user.save();

        securityService.logAudit({
          action: "ACCOUNT_LOCKED",
          userId: user._id.toString(),
          email: normalizedEmail,
          ip: req.ip,
          success: false,
          details: { failedAttempts: user.failedLoginAttempts },
        });

        return res.status(423).json({
          message:
            "Account locked due to too many failed attempts. Try again in 30 minutes.",
        });
      }

      await user.save();

      securityService.logAudit({
        action: "LOGIN_FAILED",
        userId: user._id.toString(),
        email: normalizedEmail,
        ip: req.ip,
        success: false,
        details: {
          reason: "Invalid password",
          attemptCount: user.failedLoginAttempts,
        },
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Successful login - reset failed attempts
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    user.isLoggedIn = true;
    await user.save();

    securityService.clearFailedAttempts(normalizedEmail);
    securityService.logAudit({
      action: "LOGIN_SUCCESS",
      userId: user._id.toString(),
      email: normalizedEmail,
      ip: req.ip,
      success: true,
    });

    const token = generateToken(user._id.toString());
    res.json({
      token,
      userId: user._id.toString(),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        taskAnalysisSchedule: user.taskAnalysisSchedule,
        authProvider: user.authProvider,
      },
    });
  } catch (error: any) {
    securityService.logAudit({
      action: "LOGIN_ERROR",
      email: req.body.email,
      ip: req.ip,
      success: false,
      details: { error: error.message },
    });
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// ========== LOGOUT ==========
export const logout = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const userId = req.body.userId;

    await User.findByIdAndUpdate(userId, {
      fcmToken: null,
      isLoggedIn: false,
    });

    securityService.logAudit({
      action: "LOGOUT",
      userId,
      ip: req.ip,
      success: true,
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error logging out", error: error.message });
  }
};

// ========== VERIFY EMAIL ==========
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { token } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    securityService.logAudit({
      action: "EMAIL_VERIFIED",
      userId: user._id.toString(),
      email: user.email,
      ip: req.ip,
      success: true,
    });

    res.json({ message: "Email verified successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error verifying email", error: error.message });
  }
};

// ========== RESEND VERIFICATION ==========
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        message: "If an account exists, a verification email will be sent.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    await emailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationToken
    );

    res.json({
      message: "If an account exists, a verification email will be sent.",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({
        message: "Error sending verification email",
        error: error.message,
      });
  }
};

// ========== FORGOT PASSWORD ==========
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success message to prevent email enumeration
    if (!user) {
      securityService.logAudit({
        action: "PASSWORD_RESET_REQUEST",
        email,
        ip: req.ip,
        success: false,
        details: { reason: "User not found" },
      });
      return res.json({
        message:
          "If an account exists with that email, you will receive a password reset link.",
      });
    }

    // Check if user is a Google account
    if (user.authProvider === "google") {
      return res.status(400).json({
        message:
          "This account uses Google sign-in. Please use Google to log in.",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    await emailService.sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken
    );

    securityService.logAudit({
      action: "PASSWORD_RESET_REQUEST",
      userId: user._id.toString(),
      email: user.email,
      ip: req.ip,
      success: true,
    });

    res.json({
      message:
        "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error processing password reset request",
      error: error.message,
    });
  }
};

// ========== RESET PASSWORD ==========
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      securityService.logAudit({
        action: "PASSWORD_RESET_FAILED",
        ip: req.ip,
        success: false,
        details: { reason: "Invalid or expired token" },
      });
      return res.status(400).json({
        message: "Invalid or expired password reset token",
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Also reset any account locks
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    securityService.logAudit({
      action: "PASSWORD_RESET_SUCCESS",
      userId: user._id.toString(),
      email: user.email,
      ip: req.ip,
      success: true,
    });

    res.json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};
