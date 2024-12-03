// import React, { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { Calendar, Clock, MessageSquare, Sparkles } from "lucide-react";

// // Define the types for the component props
// interface TaskDetailModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   task: {
//     id: string;
//     title: string;
//     description: string;
//     category: string;
//     priority: string;
//     progress: number;
//     dueDate: string;
//     aiOptimized: boolean;
//   };
// }

// export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
//   isOpen,
//   onClose,
//   task,
// }) => {
//   const [isEditing, setIsEditing] = useState<boolean>(false);

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             {task.title}
//             {task.aiOptimized && <Sparkles className="h-4 w-4 text-primary" />}
//           </DialogTitle>
//           <DialogDescription>{task.category}</DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <div className="space-y-2">
//             <h4 className="font-medium">Description</h4>
//             <p className="text-sm text-muted-foreground">{task.description}</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Badge
//               variant={
//                 task.priority === "High"
//                   ? "destructive"
//                   : task.priority === "Medium"
//                   ? "default"
//                   : "secondary"
//               }
//             >
//               {task.priority} Priority
//             </Badge>
//             <div className="flex items-center text-sm text-muted-foreground">
//               <Calendar className="mr-2 h-4 w-4" />
//               Due {task.dueDate}
//             </div>
//           </div>
//           <div className="space-y-2">
//             <div className="flex justify-between text-sm font-medium">
//               <span>Progress</span>
//               <span>{task.progress}%</span>
//             </div>
//             <Progress value={task.progress} className="w-full" />
//           </div>
//           {task.aiOptimized && (
//             <div className="flex items-start gap-2 rounded-md border p-3">
//               <Sparkles className="h-5 w-5 text-primary mt-0.5" />
//               <div className="space-y-1">
//                 <p className="text-sm font-medium">AI Optimized</p>
//                 <p className="text-xs text-muted-foreground">
//                   This task has been optimized by AI for better productivity.
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//         <div className="flex justify-between">
//           <Button variant="outline" onClick={() => setIsEditing(true)}>
//             Edit Task
//           </Button>
//           <Button variant="default" className="bg-primary" onClick={onClose}>
//             Close
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar, Sparkles, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  progress: number;
  dueDate: string; // Format: "YYYY-MM-DD"
  aiOptimized: boolean;
}

// Define the props for the TaskDetailModal component
interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave: (updatedTask: Task) => void;
  // onDelete: (taskId: string) => void;
  task: Task;
}

// Component implementation
export function TaskDetailModal({
  isOpen,
  onClose,
  // onSave,
  // onDelete,
  task,
}: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  // const handleSave = () => {
  //   onSave(editedTask); // Pass updated task to parent
  //   setIsEditing(false); // Exit editing mode
  // };

  // const handleDelete = () => {
  //   onDelete(task.id); // Notify parent to delete task
  //   onClose(); // Close modal after delete
  // };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
          <DialogDescription>
            {isEditing ? (
              <Input
                value={editedTask.category}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, category: e.target.value })
                }
              />
            ) : (
              task.category
            )}
          </DialogDescription>
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
                  task.priority === "High"
                    ? "destructive"
                    : task.priority === "Medium"
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
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editedTask.progress}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        progress: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-16 text-right"
                  />
                ) : (
                  `${task.progress}%`
                )}
              </span>
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
        <DialogFooter className="sm:justify-between">
          <div>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                // onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Task
              </Button>
            )}
          </div>
          <div className="flex items-center">
            <Button
              variant="destructive"
              // onClick={handleDelete}
              className="mr-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
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
