import { useState } from "react";
import {
  useCreateNLPTaskMutation,
  useCreateTaskMutation,
} from "@/store/taskStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CalendarIcon, Loader2, Sparkles, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function NewTaskModal() {
  const [open, setOpen] = useState(false);
  const [isNlpMode, setIsNlpMode] = useState(false);
  const [nlpInput, setNlpInput] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("23:59");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: createNLPTask, isPending: isNLPProcessing } =
    useCreateNLPTaskMutation();

  const { mutate: createTask, isPending: isProcessing } =
    useCreateTaskMutation();

  const handleNlpSubmit = () => {
    setErrorMessage(null);

    createNLPTask(nlpInput, {
      onSuccess: () => {
        setNlpInput("");
        setOpen(false);
      },
      onError: (error: any) => {
        const errorResponse =
          error?.response?.data?.message || "Failed to create task using AI.";
        setErrorMessage(errorResponse);
      },
    });
  };

  const handleManualSubmit = () => {
    if (!taskName || !priority || !date) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      // Combine date and time
      const combinedDateTime = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      combinedDateTime.setHours(hours, minutes, 0, 0);

      // Validate that the combined date/time is not in the past
      if (combinedDateTime < new Date()) {
        setErrorMessage("Due date and time cannot be in the past.");
        return;
      }

      createTask(
        {
          title: taskName,
          description,
          priority,
          dueDate: combinedDateTime.toISOString(),
        },
        {
          onSuccess: () => {
            // Reset the inputs and close the dialog
            setTaskName("");
            setDescription("");
            setPriority("");
            setDate(undefined);
            setTime("23:59");
            setOpen(false);
            setErrorMessage(null);
          },
          onError: (error: any) => {
            const errorResponse =
              error?.response?.data?.message || "Failed to create task.";
            setErrorMessage(errorResponse);
          },
        }
      );
    } catch (error) {
      setErrorMessage("Invalid date or time selected.");
    }
  };

  const handleSubmit = async () => {
    if (isNlpMode) {
      handleNlpSubmit();
    } else {
      handleManualSubmit();
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    // Only close the popover if a date was actually selected
    if (selectedDate) {
      setDatePickerOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="nlp-mode">
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
              <Button onClick={handleSubmit} disabled={isNLPProcessing}>
                {isNLPProcessing ? (
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
                <Label>Due Date and Time</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDatePickerOpen(true);
                        }}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      onInteractOutside={(e) => {
                        // Prevent closing when clicking inside the calendar
                        if (
                          e.target instanceof Node &&
                          e.target.contains(document.querySelector(".rdp"))
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        fromDate={new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full sm:w-32"
                  />
                </div>
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <Button onClick={handleSubmit} disabled={isProcessing || !date}>
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
      </DialogContent>
    </Dialog>
  );
}
