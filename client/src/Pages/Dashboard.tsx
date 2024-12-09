import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { NewTaskModal } from "@/components/ui/newTask";
import { TaskCard } from "@/components/taskCard";
import api from "@/utils/api";
import { jwtDecode } from "jwt-decode";
// import { ThemeToggle } from "@/components/theme-toggle"

export default function TaskDashboard() {
  const [prioritizationEnabled, setPrioritizationEnabled] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "today" | "upcoming">(
    "all"
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  interface JwtPayload {
    id: string;
    email: string;
    name: string;
  }

  interface Task {
    id: string;
    title: string;
    category: string;
    priority: string;
    progress: number;
    dueTime: string;
    dueDate: string;
    description: string;
    status: string;
    completed?: boolean;
  }

  // Decode the token and retrieve the user ID
  const getUserIdFromToken = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.id;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const filterTasks = (tasks: Task[], completed: boolean = false) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    return tasks.filter((task) => {
      // First, check completion status
      const isCompletedMatch = completed
        ? ["completed", "Completed"].includes(task.status) || task.completed
        : !task.completed &&
          ["Pending", "In-progress", "pending", "in-progress"].includes(
            task.status
          );

      // Then apply time-based filtering
      switch (taskFilter) {
        case "today":
          return isCompletedMatch && task.dueDate === today;
        case "upcoming":
          return isCompletedMatch && new Date(task.dueDate) > new Date(today);
        default: // 'all' case
          return isCompletedMatch;
      }
    });
  };

  const fetchTasksForUser = async (userId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Fetch tasks for the user
      const response = await api.get(`/tasks/user/${userId}`);
      console.log("Fetched tasks:", response.data);

      // Update the tasks state
      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to load tasks. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = getUserIdFromToken();
    if (userId) {
      fetchTasksForUser(userId);
    } else {
      setErrorMessage("User not authenticated");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                TaskWise
              </h1>
              <p className="text-muted-foreground">Powered by advanced AI</p>
            </div>
            <div className="flex items-center gap-4">
              {/* <ThemeToggle /> */}
              {/* <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button> */}
              <NewTaskModal />
            </div>
          </div>

          {/* AI Assistant Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Suggestions
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="prioritization"
                    checked={prioritizationEnabled}
                    onCheckedChange={setPrioritizationEnabled}
                  />
                  <label
                    htmlFor="prioritization"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    AI Prioritization
                  </label>
                </div>
              </div>
              <CardDescription>
                {prioritizationEnabled
                  ? "AI is actively prioritizing your tasks based on importance and deadlines"
                  : "Enable AI prioritization for smart task management"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Productivity Insight</p>
                  <p className="text-sm text-muted-foreground">
                    You're most productive between 9 AM and 11 AM. Consider
                    scheduling important tasks during this time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Task Optimization</p>
                  <p className="text-sm text-muted-foreground">
                    Breaking down "Project Review" into smaller tasks could
                    improve completion rate by 35%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tasks Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tasks Overview</CardTitle>
                  <Select
                    defaultValue="all"
                    value={taskFilter}
                    onValueChange={(value: "all" | "today" | "upcoming") =>
                      setTaskFilter(value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="in-progress" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>

                  {/* ideal test taskcard template */}
                  <TabsContent value="in-progress" className="space-y-4">
                    <TaskCard
                      id="1"
                      title="Update Design System"
                      category="Design"
                      priority="High"
                      progress={65}
                      dueTime="2 hours"
                      aiPrioritized={prioritizationEnabled}
                      description="Revise and update the company's design system to ensure consistency across all products."
                      dueDate="2023-07-15"
                    />
                  </TabsContent>

                  <TabsContent value="in-progress" className="space-y-4">
                    {filterTasks(tasks).map((task) => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        category={task.category}
                        priority={task.priority}
                        progress={task.progress}
                        dueTime={task.dueTime}
                        completed={task.completed}
                        dueDate={task.dueDate}
                        aiPrioritized={prioritizationEnabled}
                        description={task.description}
                      />
                    ))}
                    {filterTasks(tasks).length === 0 && (
                      <p className="text-muted-foreground">No tasks found.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="completed" className="space-y-4">
                    {filterTasks(tasks, true).map((task) => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        category={task.category}
                        priority={task.priority}
                        progress={task.progress}
                        dueTime={task.dueTime}
                        dueDate={task.dueDate}
                        completed
                        aiPrioritized={prioritizationEnabled}
                        description={task.description}
                      />
                    ))}
                    {filterTasks(tasks, true).length === 0 && (
                      <p className="text-muted-foreground">
                        No completed tasks found.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Progress & Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Progress & Stats</CardTitle>
                <CardDescription>Your productivity metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Weekly Progress
                    </span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Quick Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                      label="Completed"
                      value="24"
                    />
                    <StatCard
                      icon={<Clock className="w-4 h-4 text-blue-500" />}
                      label="In Progress"
                      value="12"
                    />
                    <StatCard
                      icon={<ListTodo className="w-4 h-4 text-primary" />}
                      label="Total Tasks"
                      value="36"
                    />
                    <StatCard
                      icon={<Star className="w-4 h-4 text-yellow-500" />}
                      label="Priority"
                      value="8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
