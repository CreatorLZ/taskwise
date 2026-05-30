import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Clock } from "lucide-react";
import useTaskStore, { Task } from "@/store/taskStore";
import { format } from "date-fns";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask?: (task: Task) => void;
}

export function SearchDialog({
  open,
  onOpenChange,
  onSelectTask,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tasks = useTaskStore((state) => state.tasks);

  // Filter tasks based on query
  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks.slice(0, 10); // Show recent tasks when no query

    const lowerQuery = query.toLowerCase();
    return tasks
      .filter((task) => {
        return (
          task.title.toLowerCase().includes(lowerQuery) ||
          task.description?.toLowerCase().includes(lowerQuery) ||
          task.priority.toLowerCase().includes(lowerQuery) ||
          task.status?.toLowerCase().includes(lowerQuery)
        );
      })
      .slice(0, 10);
  }, [query, tasks]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTasks]);

  // Reset query when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredTasks.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredTasks[selectedIndex] && onSelectTask) {
            onSelectTask(filteredTasks[selectedIndex]);
            onOpenChange(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [filteredTasks, selectedIndex, onSelectTask, onOpenChange]
  );

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      default:
        return "bg-primary/10 text-primary hover:bg-primary/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Tasks</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search tasks... (type to filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 p-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No tasks found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTasks.map((task, index) => (
                <button
                  key={task._id}
                  onClick={() => {
                    onSelectTask?.(task);
                    onOpenChange(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{task.title}</span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.formattedDueDate ||
                          format(new Date(task.dueDate), "MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.dueTime}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-muted rounded">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-muted rounded">↵</kbd> select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 bg-muted rounded">esc</kbd> close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SearchDialog;
