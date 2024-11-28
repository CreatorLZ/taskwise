import mongoose, { Document, Schema, Types } from "mongoose";

interface IPriorityLog {
  oldPriority: string;
  newPriority: string;
  reason: string;
  timestamp: Date;
}

interface ITask extends Document {
  title: string;
  description?: string;
  completed: boolean;
  priority: string; // "low", "medium", "high"
  dueDate: Date;
  status: string; // "pending", "in-progress", "completed"
  reminderTime?: Date;
  userId: Types.ObjectId;
  retouchedByAI: boolean; // Tracks if AI has analyzed the task
  priorityLogs: IPriorityLog[]; // Logs priority changes
}

const PriorityLogSchema: Schema = new Schema({
  oldPriority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  newPriority: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
    required: true,
  },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending",
  },
  reminderTime: { type: Date },
  userId: { type: Types.ObjectId, required: true },
  retouchedByAI: { type: Boolean, default: false }, // Indicates if AI has modified the task
  priorityLogs: { type: [PriorityLogSchema], default: [] }, // Stores priority change history
});

const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;
