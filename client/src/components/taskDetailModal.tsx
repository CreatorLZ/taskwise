import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader, Sparkles, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from "@/store/taskStore";

interface Task {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  previousPriority?: string;
  progress: number;
  dueDate: string;
  aiOptimized: boolean;
  completed: boolean;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  // Use the mutation hooks
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Handle task deletion
  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task._id);
      onClose(); // Close modal after successful deletion
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Handle marking task as complete
  const handleMarkComplete = async () => {
    try {
      if (!task.completed) {
        // When marking as complete, store the current priority
        await updateTaskMutation.mutateAsync({
          taskId: task._id,
          updates: {
            completed: true,
            previousPriority: task.priority, // Store current priority
            priority: "Completed",
          },
        });
      } else {
        // When marking as incomplete, restore the previous priority or default to "Medium"
        await updateTaskMutation.mutateAsync({
          taskId: task._id,
          updates: {
            completed: false,
            priority: task.previousPriority || "Medium",
            previousPriority: undefined, // Clear the stored priority
          },
        });
      }
    } catch (error) {
      console.error("Failed to update task completion status:", error);
    }
  };

  // Handle saving edited task
  const handleSave = async () => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task._id,
        updates: {
          title: editedTask.title,
          description: editedTask.description,
          category: editedTask.category,
          priority: editedTask.priority,
          progress: editedTask.progress,
          dueDate: editedTask.dueDate,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save task updates:", error);
    }
  };

  // Check if any mutation is in progress
  const isProcessingUpdate = updateTaskMutation.isPending;

  const isProcessingDelete = deleteTaskMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-x-auto pt-10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className="font-bold text-lg"
              />
            ) : (
              <>
                {task.title}
                {task.aiOptimized && (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            {isEditing ? (
              <Textarea
                value={editedTask.description}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, description: e.target.value })
                }
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          {/* Priority and Due Date */}
          <div className="flex items-center gap-4">
            {isEditing ? (
              <Select
                value={editedTask.priority}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    priority: value as Task["priority"],
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant={
                  task.priority.toLowerCase() === "high"
                    ? "destructive"
                    : task.priority.toLowerCase() === "medium"
                    ? "default"
                    : "secondary"
                }
              >
                {task.priority} Priority
              </Badge>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              {isEditing ? (
                <Input
                  type="date"
                  value={editedTask.dueDate}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, dueDate: e.target.value })
                  }
                />
              ) : (
                `Due ${task.dueDate}`
              )}
            </div>
          </div>
          {/* Progress. change to time elapsed on server */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Time elapsed</span>
              <span>{task.progress}%</span>
            </div>
            <Progress
              value={isEditing ? editedTask.progress : task.progress}
              className="w-full"
            />
          </div>
          {/* AI Optimized Badge */}
          {task.aiOptimized && (
            <div className="flex items-start gap-2 rounded-md border p-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">AI Optimized</p>
                <p className="text-xs text-muted-foreground">
                  This task has been optimized by AI for better productivity.
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Footer Buttons */}
        <DialogFooter className="sm:justify-between flex-row justify-between gap-3">
          <div>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className=""
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="mt-3"
                  disabled={isProcessingUpdate || isProcessingDelete}
                >
                  {isProcessingUpdate || isProcessingDelete ? (
                    <>
                      Saving
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    " Save Changes"
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={isProcessingUpdate || isProcessingDelete}
              >
                Edit Task
              </Button>
            )}
          </div>
          <div className="flex justify-between gap-3">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isProcessingUpdate || isProcessingDelete}
              className=""
            >
              {isProcessingDelete ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Deleting
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </>
              )}
            </Button>
            <Button
              variant={task.completed ? "secondary" : "default"}
              onClick={handleMarkComplete}
              disabled={isProcessingUpdate || isProcessingDelete}
              className=""
            >
              {task.completed ? "Mark Incomplete" : "Mark Complete"}
              {isProcessingUpdate ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                ""
              )}
            </Button>
            {!isEditing && (
              <Button
                variant="default"
                className="bg-primary"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
