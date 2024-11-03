import mongoose, { Document, Schema } from "mongoose";

interface ITask extends Document {
  title: string;
  description?: string;
  completed: boolean;
  priority: string; // "low", "medium", "high"
  dueDate: Date;
  status: string; // "pending", "in-progress", "completed"
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
});

const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;
