import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isLoggedIn?: boolean;
  _id: Types.ObjectId;
  failedLoginAttempts: number;
  isLocked: boolean;
  comparePassword(plainPassword: string): Promise<boolean>;
  fcmToken?: string;
  tasks: Types.ObjectId[]; // Array of task references
  taskAnalysisSchedule: TaskAnalysisSchedule; // Task analysis schedule
  googleId?: string; // Google unique identifier
  avatar?: string; // Profile image URL
  authProvider: string; // Auth provider (local, google)
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
    isLoggedIn: { type: Boolean, default: false },
    fcmToken: { type: String },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }], // Reference to Task collection
    googleId: { type: String },
    avatar: { type: String },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10); // salt rounds for security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  plainPassword: string
): Promise<boolean> {
  // If no password (Google user), return false
  if (!this.password) return false;
  return await bcrypt.compare(plainPassword, this.password);
};

// Index email for faster querying
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

export default mongoose.model<IUser>("User", UserSchema);
