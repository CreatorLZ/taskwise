import { useState } from "react";
import api from "@/utils/api"; // Import the API utility
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CalendarIcon,
  Loader2,
  MessageSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NewTaskModal() {
  const [isNlpMode, setIsNlpMode] = useState(false);
  const [nlpInput, setNlpInput] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNlpSubmit = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await api.post("/create-from-nlp", {
        command: nlpInput,
      });
      console.log("NLP Task created:", response.data);
      // Reset the input and close the dialog
      setNlpInput("");
    } catch (error: any) {
      const errorResponse =
        error?.response?.data?.message || "Failed to create task using AI.";
      setErrorMessage(errorResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await api.post("/tasks", {
        title: taskName,
        description,
        priority,
        dueDate: date?.toISOString(),
      });
      console.log("Manual Task created:", response.data);
      // Reset the inputs and close the dialog
      setTaskName("");
      setDescription("");
      setPriority("");
      setDate(undefined);
    } catch (error: any) {
      const errorResponse =
        error?.response?.data?.message || "Failed to create task.";
      setErrorMessage(errorResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (isNlpMode) {
      await handleNlpSubmit();
    } else {
      await handleManualSubmit();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your TaskWise list. Use AI-powered natural
            language input for quick task creation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="nlp-mode"
              checked={isNlpMode}
              onCheckedChange={setIsNlpMode}
            />
            <Label
              htmlFor="nlp-mode"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use AI-powered natural language input
            </Label>
          </div>
          {isNlpMode ? (
            <div className="grid gap-2">
              <Label htmlFor="nlp-input">Describe your task</Label>
              <Textarea
                id="nlp-input"
                placeholder="E.g., Schedule a meeting for Monday at 10 AM"
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
              />
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <Button onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create with AI
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="task-name">Task name</Label>
                <Input
                  id="task-name"
                  placeholder="Enter task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <Button onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </>
          )}
        </div>
        <DialogFooter className="text-muted-foreground flex justify-center w-full text-center ">
          {isProcessing ? "Task creation usually takes seconds..." : ""}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
