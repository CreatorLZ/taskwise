import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskDetailModal } from "@/components/taskDetailModal";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

// Define the types for the component props
interface TaskCardProps {
  id: string;
  title: string;
  category: string;
  priority: string;
  progress: number;
  dueTime: string;
  completed?: boolean;
  aiPrioritized?: boolean;
  description: string;
  dueDate: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  category,
  priority,
  progress,
  dueTime,
  completed = false,
  aiPrioritized = false,
  description,
  dueDate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <>
      <div
        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            {completed ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
            ) : (
              <Circle className="w-4 h-4 text-blue-500 mt-1" />
            )}
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {title}
                {aiPrioritized && !completed && (
                  <Sparkles className="w-3 h-3 text-primary" />
                )}
              </h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              priority === "High"
                ? "bg-red-500/20 text-red-500"
                : priority === "Medium"
                ? "bg-yellow-500/20 text-yellow-500"
                : priority === "Completed"
                ? "bg-green-500/20 text-green-500"
                : "bg-blue-500/20 text-blue-500"
            }`}
          >
            {priority}
          </span>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Due {dueTime}</span>
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={{
            id,
            title,
            description,
            category,
            priority,
            progress,
            dueDate,
            aiOptimized: aiPrioritized,
          }}
        />
      )}
    </>
  );
};
