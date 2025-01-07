import React from "react";
import { ListTodo, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmptyTaskState = ({ onCreateTask }: { onCreateTask?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/10 rounded-lg">
      <ListTodo className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">No tasks yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Ready to boost your productivity? Start by creating your first task
          and let TaskWise help you stay organized.
        </p>
      </div>
      {onCreateTask && (
        <Button onClick={onCreateTask} className="mt-4">
          Create your first task
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default EmptyTaskState;
