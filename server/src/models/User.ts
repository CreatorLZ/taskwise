import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isLoggedIn?: boolean;
  _id: Types.ObjectId;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockUntil?: Date; // New: timed unlocking
  comparePassword(plainPassword: string): Promise<boolean>;
  fcmToken?: string;
  tasks: Types.ObjectId[];
  taskAnalysisSchedule: TaskAnalysisSchedule;
  googleId?: string;
  avatar?: string;
  authProvider: string;
  // New: Email verification fields
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  // New: Password reset fields
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  // New: Methods
  generateVerificationToken(): string;
  generatePasswordResetToken(): string;
}

interface TaskAnalysisSchedule {
  firstRunTime: string;
  secondRunTime: string;
  enabled: boolean;
}

const UserSchema: Schema<IUser> = new Schema(
  {
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
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
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
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12); // Increased salt rounds for security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  plainPassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(plainPassword, this.password);
};

// Generate email verification token
UserSchema.methods.generateVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function (): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Check if account is locked and should remain locked
UserSchema.methods.isAccountLocked = function (): boolean {
  if (!this.isLocked) return false;
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

export default mongoose.model<IUser>("User", UserSchema);
