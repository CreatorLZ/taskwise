import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MessageSquare, Sparkles } from "lucide-react";

// Define the types for the component props
interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    progress: number;
    dueDate: string;
    aiOptimized: boolean;
  };
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.title}
            {task.aiOptimized && <Sparkles className="h-4 w-4 text-primary" />}
          </DialogTitle>
          <DialogDescription>{task.category}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>
          <div className="flex items-center gap-4">
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
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              Due {task.dueDate}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="w-full" />
          </div>
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
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Task
          </Button>
          <Button variant="default" className="bg-primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
