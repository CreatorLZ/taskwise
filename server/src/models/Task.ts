import mongoose, { Document, Schema, Types } from "mongoose";

// ========== SUBTASK INTERFACE ==========
interface ISubtask {
  _id?: Types.ObjectId;
  title: string;
  completed: boolean;
  order: number;
}

// ========== RECURRENCE INTERFACE ==========
interface IRecurrence {
  enabled: boolean;
  pattern: "daily" | "weekly" | "monthly" | "custom";
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // For weekly: 0=Sun, 1=Mon, etc.
  endDate?: Date;
  nextOccurrence?: Date;
  lastGenerated?: Date;
}

// ========== TIME TRACKING INTERFACE ==========
interface ITimeTracking {
  estimatedMinutes?: number;
  actualMinutes: number;
  pomodoroSessions: number;
}

// ========== PRIORITY LOG INTERFACE ==========
interface IPriorityLog {
  oldPriority: string;
  newPriority: string;
  reason: string;
  timestamp: Date;
}

// ========== TASK INTERFACE ==========
export interface ITask extends Document {
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  previousPriority?: string;
  dueDate: Date;
  dueTime: Date;
  status: string;
  reminderTime?: Date;
  userId: Types.ObjectId;
  retouchedByAI: boolean;
  priorityLogs: IPriorityLog[];
  createdAt: Date;
  updatedAt: Date;
  progress: Number;
  notificationSent: boolean;
  // New fields
  tags: string[];
  category?: string;
  subtasks: ISubtask[];
  recurrence?: IRecurrence;
  timeTracking: ITimeTracking;
  parentTaskId?: Types.ObjectId; // For recurring task instances
  isRecurrenceInstance?: boolean;
}

// ========== SCHEMAS ==========

const SubtaskSchema: Schema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
});

const RecurrenceSchema: Schema = new Schema({
  enabled: { type: Boolean, default: false },
  pattern: {
    type: String,
    enum: ["daily", "weekly", "monthly", "custom"],
    default: "daily",
  },
  interval: { type: Number, default: 1, min: 1, max: 365 },
  daysOfWeek: [{ type: Number, min: 0, max: 6 }],
  endDate: { type: Date },
  nextOccurrence: { type: Date },
  lastGenerated: { type: Date },
});

const TimeTrackingSchema: Schema = new Schema({
  estimatedMinutes: { type: Number, min: 0 },
  actualMinutes: { type: Number, default: 0, min: 0 },
  pomodoroSessions: { type: Number, default: 0, min: 0 },
});

const PriorityLogSchema: Schema = new Schema({
  oldPriority: {
    type: String,
    enum: ["Low", "Medium", "High", "Completed"],
    required: true,
  },
  newPriority: {
    type: String,
    enum: ["Low", "Medium", "High", "Completed"],
    required: true,
  },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Completed"],
      default: "Medium",
      required: true,
    },
    previousPriority: { type: String },
    dueDate: { type: Date, required: true },
    dueTime: { type: Date },
    status: {
      type: String,
      enum: ["Pending", "In-progress", "Completed"],
      default: "Pending",
    },
    reminderTime: { type: Date },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    retouchedByAI: { type: Boolean, default: false },
    priorityLogs: { type: [PriorityLogSchema], default: [] },
    notificationSent: { type: Boolean, default: false },
    // New fields
    tags: { type: [String], default: [], maxlength: 10 },
    category: {
      type: String,
      maxlength: 50,
      enum: [
        "Work",
        "Personal",
        "Health",
        "Learning",
        "Finance",
        "Social",
        "Other",
        null,
      ],
    },
    subtasks: { type: [SubtaskSchema], default: [] },
    recurrence: { type: RecurrenceSchema },
    timeTracking: {
      type: TimeTrackingSchema,
      default: () => ({ actualMinutes: 0, pomodoroSessions: 0 }),
    },
    parentTaskId: { type: Types.ObjectId, ref: "Task" },
    isRecurrenceInstance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ========== INDEXES ==========
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, completed: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ userId: 1, category: 1 });
TaskSchema.index({ "recurrence.enabled": 1, "recurrence.nextOccurrence": 1 });

// ========== VIRTUALS ==========
TaskSchema.virtual("subtaskProgress").get(function (this: ITask) {
  if (!this.subtasks || this.subtasks.length === 0) return 100;
  const completed = this.subtasks.filter((s) => s.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

// ========== MIDDLEWARE ==========
// Auto-update progress when subtasks change
TaskSchema.pre("save", function (next) {
  if (this.isModified("subtasks") && Array.isArray(this.subtasks)) {
    const subtasks = this.subtasks as ISubtask[];
    if (subtasks.length > 0) {
      const completedCount = subtasks.filter((s) => s.completed).length;
      // If all subtasks done, mark parent as completed
      if (completedCount === subtasks.length && subtasks.length > 0) {
        this.completed = true;
        this.status = "Completed";
        this.priority = "Completed";
      }
    }
  }
  next();
});

const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;
