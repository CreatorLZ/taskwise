"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.logout = exports.login = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const securityService_1 = __importDefault(require("../services/securityService"));
const emailService_1 = __importDefault(require("../services/emailService"));
// ========== REGISTER ==========
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const existingUser = yield User_1.default.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            securityService_1.default.logAudit({
                action: "REGISTER_FAILED",
                email,
                ip: req.ip,
                success: false,
                details: { reason: "Email already exists" },
            });
            return res.status(400).json({ message: "User already exists" });
        }
        const user = new User_1.default({
            username,
            email: email.toLowerCase(),
            password,
            authProvider: "local",
            emailVerified: false,
        });
        // Generate verification token
        const verificationToken = user.generateVerificationToken();
        yield user.save();
        // Send verification email (non-blocking)
        emailService_1.default
            .sendVerificationEmail(user.email, user.username, verificationToken)
            .catch((err) => console.error("Failed to send verification email:", err));
        securityService_1.default.logAudit({
            action: "REGISTER_SUCCESS",
            userId: user._id.toString(),
            email,
            ip: req.ip,
            success: true,
        });
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.status(201).json({
            token,
            message: "Registration successful. Please check your email to verify your account.",
            userId: user._id.toString(),
        });
    }
    catch (error) {
        securityService_1.default.logAudit({
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
});
exports.register = register;
// ========== LOGIN ==========
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();
        const user = yield User_1.default.findOne({ email: normalizedEmail });
        if (!user) {
            securityService_1.default.logAudit({
                action: "LOGIN_FAILED",
                email: normalizedEmail,
                ip: req.ip,
                success: false,
                details: { reason: "User not found" },
            });
            return res.status(401).json({ message: "Invalid credentials" });
        }
        if (user.authProvider === "google" && !user.password) {
            securityService_1.default.logAudit({
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
                const minutesRemaining = Math.ceil((user.lockUntil.getTime() - now.getTime()) / (1000 * 60));
                securityService_1.default.logAudit({
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
        const isPasswordValid = yield user.comparePassword(password);
        if (!isPasswordValid) {
            // Track failed attempt
            user.failedLoginAttempts += 1;
            const { shouldLock, attemptCount } = securityService_1.default.trackFailedAttempt(normalizedEmail);
            if (shouldLock || user.failedLoginAttempts >= 5) {
                user.isLocked = true;
                user.lockUntil = securityService_1.default.calculateLockUntil();
                yield user.save();
                securityService_1.default.logAudit({
                    action: "ACCOUNT_LOCKED",
                    userId: user._id.toString(),
                    email: normalizedEmail,
                    ip: req.ip,
                    success: false,
                    details: { failedAttempts: user.failedLoginAttempts },
                });
                return res.status(423).json({
                    message: "Account locked due to too many failed attempts. Try again in 30 minutes.",
                });
            }
            yield user.save();
            securityService_1.default.logAudit({
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
        yield user.save();
        securityService_1.default.clearFailedAttempts(normalizedEmail);
        securityService_1.default.logAudit({
            action: "LOGIN_SUCCESS",
            userId: user._id.toString(),
            email: normalizedEmail,
            ip: req.ip,
            success: true,
        });
        const token = (0, jwt_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        securityService_1.default.logAudit({
            action: "LOGIN_ERROR",
            email: req.body.email,
            ip: req.ip,
            success: false,
            details: { error: error.message },
        });
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
});
exports.login = login;
// ========== LOGOUT ==========
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        yield User_1.default.findByIdAndUpdate(userId, {
            fcmToken: null,
            isLoggedIn: false,
        });
        securityService_1.default.logAudit({
            action: "LOGOUT",
            userId,
            ip: req.ip,
            success: true,
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error logging out", error: error.message });
    }
});
exports.logout = logout;
// ========== VERIFY EMAIL ==========
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        // Hash the token to compare with stored hash
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = yield User_1.default.findOne({
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
        yield user.save();
        securityService_1.default.logAudit({
            action: "EMAIL_VERIFIED",
            userId: user._id.toString(),
            email: user.email,
            ip: req.ip,
            success: true,
        });
        res.json({ message: "Email verified successfully" });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error verifying email", error: error.message });
    }
});
exports.verifyEmail = verifyEmail;
// ========== RESEND VERIFICATION ==========
const resendVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.default.findOne({ email: email.toLowerCase() });
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
        yield user.save();
        yield emailService_1.default.sendVerificationEmail(user.email, user.username, verificationToken);
        res.json({
            message: "If an account exists, a verification email will be sent.",
        });
    }
    catch (error) {
        res
            .status(500)
            .json({
            message: "Error sending verification email",
            error: error.message,
        });
    }
});
exports.resendVerification = resendVerification;
// ========== FORGOT PASSWORD ==========
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.default.findOne({ email: email.toLowerCase() });
        // Always return success message to prevent email enumeration
        if (!user) {
            securityService_1.default.logAudit({
                action: "PASSWORD_RESET_REQUEST",
                email,
                ip: req.ip,
                success: false,
                details: { reason: "User not found" },
            });
            return res.json({
                message: "If an account exists with that email, you will receive a password reset link.",
            });
        }
        // Check if user is a Google account
        if (user.authProvider === "google") {
            return res.status(400).json({
                message: "This account uses Google sign-in. Please use Google to log in.",
            });
        }
        const resetToken = user.generatePasswordResetToken();
        yield user.save();
        yield emailService_1.default.sendPasswordResetEmail(user.email, user.username, resetToken);
        securityService_1.default.logAudit({
            action: "PASSWORD_RESET_REQUEST",
            userId: user._id.toString(),
            email: user.email,
            ip: req.ip,
            success: true,
        });
        res.json({
            message: "If an account exists with that email, you will receive a password reset link.",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error processing password reset request",
            error: error.message,
        });
    }
});
exports.forgotPassword = forgotPassword;
// ========== RESET PASSWORD ==========
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, password } = req.body;
        // Hash the token to compare with stored hash
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = yield User_1.default.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });
        if (!user) {
            securityService_1.default.logAudit({
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
        yield user.save();
        securityService_1.default.logAudit({
            action: "PASSWORD_RESET_SUCCESS",
            userId: user._id.toString(),
            email: user.email,
            ip: req.ip,
            success: true,
        });
        res.json({
            message: "Password has been reset successfully. You can now log in.",
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error resetting password",
            error: error.message,
        });
    }
});
exports.resetPassword = resetPassword;
