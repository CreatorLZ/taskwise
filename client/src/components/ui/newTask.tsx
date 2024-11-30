import { useState } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [date, setDate] = useState<Date>();

  const handleNlpSubmit = async () => {
    setIsProcessing(true);
    // Simulating NLP processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // Here you would typically send the nlpInput to your backend for processing
    console.log("NLP input processed:", nlpInput);
    // Reset the input
    setNlpInput("");
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
                placeholder="E.g., Schedule a team meeting for next Tuesday at 2 PM to discuss the new project proposal"
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
              />
              <Button onClick={handleNlpSubmit} disabled={isProcessing}>
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
                <Input id="task-name" placeholder="Enter task name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="submit">Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
