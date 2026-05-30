"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const UserSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    taskAnalysisSchedule: {
        firstRunTime: { type: String, default: "" },
        secondRunTime: { type: String, default: "" },
        enabled: { type: Boolean, default: false },
    },
    password: { type: String, required: false },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date }, // When lock expires
    isLoggedIn: { type: Boolean, default: false },
    fcmToken: { type: String },
    tasks: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Task" }],
    googleId: { type: String },
    avatar: { type: String },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    // Email verification
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    // Password reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
}, { timestamps: true });
// Hash password before saving
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        const salt = yield bcryptjs_1.default.genSalt(12); // Increased salt rounds for security
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
        next();
    });
});
// Method to compare password
UserSchema.methods.comparePassword = function (plainPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.password)
            return false;
        return yield bcryptjs_1.default.compare(plainPassword, this.password);
    });
};
// Generate email verification token
UserSchema.methods.generateVerificationToken = function () {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    this.verificationToken = crypto_1.default
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
};
// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto_1.default
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return token;
};
// Check if account is locked and should remain locked
UserSchema.methods.isAccountLocked = function () {
    if (!this.isLocked)
        return false;
    if (this.lockUntil && new Date() > this.lockUntil) {
        // Lock has expired, reset it
        this.isLocked = false;
        this.failedLoginAttempts = 0;
        this.lockUntil = undefined;
        return false;
    }
    return true;
};
// Index email for faster querying
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });
exports.default = mongoose_1.default.model("User", UserSchema);
