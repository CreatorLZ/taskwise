import mongoose, { Document, Schema, Types } from "mongoose";

interface ITask extends Document {
  title: string;
  description?: string;
  completed: boolean;
  priority: string; // "low", "medium", "high"
  dueDate: Date;
  status: string; // "pending", "in-progress", "completed"
  reminderTime?: Date;
  userId: Types.ObjectId;
}

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
  userId: { type: Types.ObjectId },
});

const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;
