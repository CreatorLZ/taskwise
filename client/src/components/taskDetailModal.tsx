import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { format } from "date-fns";

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
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Use the mutation hooks
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  // Handle task deletion
  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task._id);
      setShowDeleteAlert(false);
      onClose(); // Close modal after successful deletion
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Handle marking task as complete
  const handleMarkComplete = async () => {
    try {
      if (!task.completed) {
        await updateTaskMutation.mutateAsync({
          taskId: task._id,
          updates: {
            completed: true,
            previousPriority: task.priority,
            priority: "Completed",
            status: "Completed",
          },
        });
      } else {
        await updateTaskMutation.mutateAsync({
          taskId: task._id,
          updates: {
            completed: false,
            priority: task.previousPriority || "Medium",
            previousPriority: undefined,
            status: "Pending",
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[100vw] sm:max-w-[550px] overflow-y-auto max-h-[90vh] pt-8">
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
                    setEditedTask({
                      ...editedTask,
                      description: e.target.value,
                    })
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={editedTask.dueDate.split("T")[0]}
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          dueDate: `${e.target.value}T${
                            editedTask.dueDate.split("T")[1] || "23:59"
                          }`,
                        })
                      }
                    />
                    <Input
                      type="time"
                      value={
                        editedTask.dueDate.split("T")[1]?.slice(0, 5) || "23:59"
                      }
                      onChange={(e) =>
                        setEditedTask({
                          ...editedTask,
                          dueDate: `${editedTask.dueDate.split("T")[0]}T${
                            e.target.value
                          }:00`,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {`Due ${format(
                      new Date(task.dueDate),
                      "MMM d, yyyy h:mm a"
                    )}`}
                  </div>
                )}
              </div>
            </div>
            {/* Progress */}
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
          <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between gap-4">
            <div className="flex justify-start gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isProcessingUpdate || isProcessingDelete}
                  >
                    {isProcessingUpdate || isProcessingDelete ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save Changes"
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                disabled={isProcessingUpdate || isProcessingDelete}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <Button
                variant={task.completed ? "secondary" : "default"}
                onClick={handleMarkComplete}
                disabled={isProcessingUpdate || isProcessingDelete}
                className="w-full sm:w-auto"
              >
                {task.completed ? "Mark Incomplete" : "Mark Complete"}
                {isProcessingUpdate && (
                  <Loader className="ml-2 h-4 w-4 animate-spin" />
                )}
              </Button>
              {!isEditing && (
                <Button
                  variant="default"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task "{task.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessingDelete ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
