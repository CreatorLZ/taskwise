import { useCallback, useMemo, useState } from "react";
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
  Clock,
  ListTodo,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { NewTaskModal } from "@/components/ui/newTask";
import { TaskCard } from "@/components/taskCard";

import useAuthStore from "@/store/authstore";
import useTaskStore, {
  useAIPrioritizeTasksMutation,
  useFetchTasks,
} from "@/store/taskStore";
import TaskSkeletonLoader from "@/components/taskSkeletonLoader";
import EmptyTaskState from "@/components/emptyTasksState";

export default function TaskDashboard() {
  const [prioritizationEnabled, setPrioritizationEnabled] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "today" | "upcoming">(
    "all"
  );
  const [inProgressTasksToShow, setInProgressTasksToShow] = useState(5);
  const [completedTasksToShow, setCompletedTasksToShow] = useState(5);

  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);

  // Fetch tasks using React Query
  const { isLoading, error } = useFetchTasks(userId!);

  const tasks = useTaskStore((state) => state.tasks) ?? [];

  // console.log(user);
  // console.log(tasks);
  interface Task {
    _id: string;
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

  // Memoize the filterTasks function
  const filterTasks = useCallback(
    (tasks: Task[], completed = false): Task[] => {
      if (!Array.isArray(tasks)) {
        console.warn("Tasks is not an array:", tasks);
        return [];
      }

      const today = new Date().toISOString().split("T")[0];

      const filteredTasks = tasks.filter((task: Task) => {
        if (!task) return false;

        const isCompletedMatch = completed
          ? ["completed", "Completed"].includes(task.status) || task.completed
          : !task.completed &&
            ["Pending", "In-progress", "pending", "in-progress"].includes(
              task.status
            );

        switch (taskFilter) {
          case "today":
            return isCompletedMatch && task.dueDate === today;
          case "upcoming":
            return isCompletedMatch && new Date(task.dueDate) > new Date(today);
          default:
            return isCompletedMatch;
        }
      });

      // Use different counts based on completed status
      const tasksToShow = completed
        ? completedTasksToShow
        : inProgressTasksToShow;
      return filteredTasks.slice(0, tasksToShow);
    },
    [taskFilter, inProgressTasksToShow, completedTasksToShow]
  ); // Only recreate when taskFilter changes

  // Get the total number of tasks for each category
  const totalInProgressTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.completed &&
          ["Pending", "In-progress", "pending", "in-progress"].includes(
            task.status
          )
      ).length,
    [tasks]
  );

  const totalCompletedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.completed || ["completed", "Completed"].includes(task.status)
      ).length,
    [tasks]
  );

  // Memoize the filtered results
  const filteredInProgressTasks = useMemo(
    () => filterTasks(tasks, false),
    [tasks, filterTasks]
  );

  const filteredCompletedTasks = useMemo(
    () => filterTasks(tasks, true),
    [tasks, filterTasks]
  );

  const handleLoadMoreInProgress = () => {
    setInProgressTasksToShow((prev) => prev + 5);
  };

  const handleLoadMoreCompleted = () => {
    setCompletedTasksToShow((prev) => prev + 5);
  };

  const aiPrioritizeMutation = useAIPrioritizeTasksMutation();
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
                    onCheckedChange={(checked) => {
                      setPrioritizationEnabled(checked);
                      if (checked) {
                        aiPrioritizeMutation.mutate(userId!);
                      }
                    }}
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

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <TaskSkeletonLoader key={index} />
                      ))}
                    </div>
                  ) : error?.message == "Unauthorized" ? (
                    <div>error loading tasks. try refreshing the page </div>
                  ) : tasks.length === 0 || filterTasks(tasks).length === 0 ? (
                    <EmptyTaskState />
                  ) : (
                    <>
                      <TabsContent value="in-progress" className="space-y-4">
                        {filteredInProgressTasks.map((task) => (
                          <TaskCard
                            key={task._id}
                            _id={task._id}
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
                        {filteredInProgressTasks.length === 0 ? (
                          <p className="text-muted-foreground">
                            No tasks found.
                          </p>
                        ) : (
                          filteredInProgressTasks.length <
                            totalInProgressTasks && (
                            <div className="flex justify-center mt-4">
                              <Button
                                variant="outline"
                                onClick={handleLoadMoreInProgress}
                                className="w-full max-w-xs"
                              >
                                Load More In-Progress Tasks
                              </Button>
                            </div>
                          )
                        )}
                      </TabsContent>
                      <TabsContent value="completed" className="space-y-4">
                        {filteredCompletedTasks.map((task) => (
                          <TaskCard
                            key={task._id}
                            _id={task._id}
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
                        {filteredCompletedTasks.length === 0 ? (
                          <p className="text-muted-foreground">
                            No completed tasks found.
                          </p>
                        ) : (
                          filteredCompletedTasks.length <
                            totalCompletedTasks && (
                            <div className="flex justify-center mt-4">
                              <Button
                                variant="outline"
                                onClick={handleLoadMoreCompleted}
                                className="w-full max-w-xs"
                              >
                                Load More Completed Tasks
                              </Button>
                            </div>
                          )
                        )}
                      </TabsContent>
                    </>
                  )}
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
                      value={totalCompletedTasks}
                    />
                    <StatCard
                      icon={<Clock className="w-4 h-4 text-blue-500" />}
                      label="In Progress"
                      value={totalInProgressTasks}
                    />
                    <StatCard
                      icon={<ListTodo className="w-4 h-4 text-primary" />}
                      label="Total Tasks"
                      value={tasks.length}
                    />
                    <StatCard
                      icon={<Star className="w-4 h-4 text-rose-500" />}
                      label="Priority"
                      value={
                        tasks.filter((task) => task.priority === "High").length
                      }
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
  value: number | string;
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
