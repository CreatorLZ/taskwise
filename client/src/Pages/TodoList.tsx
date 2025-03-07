"use client";

import { useState, useEffect } from "react";
import { Search, Star, SunMedium, X, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Theme options
const themeOptions = {
  colors: [
    { name: "Default", value: "bg-white" },
    { name: "Purple", value: "bg-purple-100" },
    { name: "Pink", value: "bg-pink-100" },
    { name: "Coral", value: "bg-red-100" },
    { name: "Green", value: "bg-emerald-100" },
    { name: "Teal", value: "bg-teal-100" },
    { name: "Gray", value: "bg-gray-100" },
    { name: "Light Blue", value: "bg-sky-100" },
    { name: "Light Pink", value: "bg-rose-50" },
  ],
  images: [
    {
      name: "Tropical",
      value:
        "bg-[url('https://c37uf7lofs.ufs.sh/f/GSgiKERmD2ElMZQO2i6DG9iArtUJ8yRPIZl4ShEFqjmKYB7X')] bg-cover",
    },
    {
      name: "Birds",
      value:
        "bg-[url('https://c37uf7lofs.ufs.sh/f/GSgiKERmD2ElFIBDBoKaNDB8ompjGMw0fzr2gXLVEZ7x96YJ')] bg-cover",
    },
    {
      name: "Beach Dawn",
      value:
        "bg-[url('https://c37uf7lofs.ufs.sh/f/GSgiKERmD2ElGvEQCzRmD2Elk5vfrnOaZYyC7K1BAwceSjWz')] bg-cover",
    },
    {
      name: "Beach Day",
      value:
        "bg-[url('https://c37uf7lofs.ufs.sh/f/GSgiKERmD2ElXGAvvnLZl4aPEYqDsAeyp1ohtvN7uzT6wL2j')] bg-cover",
    },
    {
      name: "Night sky",
      value:
        "bg-[url('https://c37uf7lofs.ufs.sh/f/GSgiKERmD2ElmuG6fKkMMnjUfgX8r3SqvWHYBkbwRl9dzA5y')] bg-cover",
    },
  ],
};

// Define the Task type
type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: "Low" | "Medium" | "High";
  createdAt: Date;
  pinned: boolean;
};

// Priority color mapping
const priorityColors = {
  High: "text-red-500 bg-red-50",
  Medium: "text-orange-500 bg-orange-50",
  Low: "text-blue-500 bg-blue-50",
};

export default function TodoList() {
  // State for tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from localStorage if available
    if (typeof window !== "undefined") {
      const savedTasks = localStorage.getItem("tasks");
      return savedTasks ? JSON.parse(savedTasks) : [];
    }
    return [];
  });

  // State for new task input
  const [newTask, setNewTask] = useState("");

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // State for priority filter
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // State for theme
  const [theme, setTheme] = useState<string>("bg-white");

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Add a new task
  const addTask = () => {
    if (newTask.trim() === "") return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      priority: "Medium", // Default priority
      createdAt: new Date(),
      pinned: false,
    };

    setTasks([task, ...tasks]);
    setNewTask("");
  };

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Delete a task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Change task priority
  const changePriority = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const priorities: Array<"Low" | "Medium" | "High"> = [
            "Low",
            "Medium",
            "High",
          ];
          const currentIndex = priorities.indexOf(task.priority);
          const nextIndex = (currentIndex + 1) % priorities.length;
          return { ...task, priority: priorities[nextIndex] };
        }
        return task;
      })
    );
  };

  // Add a function to sort tasks with pinned items at the top
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      // Sort by pinned status first (pinned tasks come first)
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Modify the togglePinTask function to reorder tasks
  const togglePinTask = (id: string) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) =>
        task.id === id ? { ...task, pinned: !task.pinned } : task
      );
      return sortTasks(updatedTasks);
    });
  };

  // Update the filterTasks function to use the sorted tasks
  const filterTasks = (tasksToFilter: Task[], tab: string) => {
    const filteredBySearch = tasksToFilter.filter(
      (task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (priorityFilter === null || task.priority === priorityFilter)
    );

    const filteredByTab = filteredBySearch.filter((task) => {
      if (tab === "pinned") return task.pinned;
      if (tab === "all") return true;
      if (tab === "active") return !task.completed;
      if (tab === "completed") return task.completed;
      return true;
    });

    return filteredByTab;
  };

  // Get stats
  const stats = {
    all: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    pinned: tasks.filter((t) => t.pinned).length,
  };

  return (
    <div className={`min-h-screen ${theme} transition-colors duration-300`}>
      <div className="w-full p-4 md:p-6 pb-24">
        {/* Header with Settings */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Todo List</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-gray-100"
                title="Themes"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="px-2 py-2">
                <h4 className="mb-2 text-sm font-medium leading-none">Theme</h4>
                <div className="grid grid-cols-5 gap-2">
                  {themeOptions.colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setTheme(color.value)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 transition-all",
                        color.value,
                        theme === color.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-transparent hover:border-primary/50"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {themeOptions.images.map((image) => (
                    <button
                      key={image.value}
                      onClick={() => setTheme(image.value)}
                      className={cn(
                        "w-12 h-12 rounded-lg border-2 bg-cover bg-center transition-all",
                        image.value.includes("url") ? image.value : "",
                        theme === image.value
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-transparent hover:border-primary/50"
                      )}
                      title={image.name}
                    />
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Print list</DropdownMenuItem>
              <DropdownMenuItem>Email list</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Clear all tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Rest of your existing UI components */}
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={priorityFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter(null)}
              className={priorityFilter === null ? "bg-[#0f172a]" : ""}
            >
              All
            </Button>
            <Button
              variant={priorityFilter === "High" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter("High")}
              className={
                priorityFilter === "High"
                  ? "bg-red-500"
                  : "text-red-500 border-red-200"
              }
            >
              High
            </Button>
            <Button
              variant={priorityFilter === "Medium" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter("Medium")}
              className={
                priorityFilter === "Medium"
                  ? "bg-orange-500"
                  : "text-orange-500 border-orange-200"
              }
            >
              Medium
            </Button>
            <Button
              variant={priorityFilter === "Low" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriorityFilter("Low")}
              className={
                priorityFilter === "Low"
                  ? "bg-blue-500"
                  : "text-blue-500 border-blue-200"
              }
            >
              Low
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="pinned">
              Pinned
              <Badge variant="outline" className="ml-2">
                {stats.pinned}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              All
              <Badge variant="outline" className="ml-2">
                {stats.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              In Progress
              <Badge variant="outline" className="ml-2">
                {stats.active}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="outline" className="ml-2">
                {stats.completed}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Pinned Tasks */}
          <TabsContent value="pinned" className="space-y-2">
            {filterTasks(sortTasks(tasks), "pinned").length > 0 ? (
              filterTasks(sortTasks(tasks), "pinned").map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                  onChangePriority={changePriority}
                  onTogglePin={togglePinTask}
                />
              ))
            ) : (
              <EmptyState message="No pinned tasks" />
            )}
          </TabsContent>

          {/* All Tasks */}
          <TabsContent value="all" className="space-y-2">
            {filterTasks(sortTasks(tasks), "all").length > 0 ? (
              filterTasks(sortTasks(tasks), "all").map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                  onChangePriority={changePriority}
                  onTogglePin={togglePinTask}
                />
              ))
            ) : (
              <EmptyState message="No tasks found" />
            )}
          </TabsContent>

          {/* Active Tasks */}
          <TabsContent value="active" className="space-y-2">
            {filterTasks(sortTasks(tasks), "active").length > 0 ? (
              filterTasks(sortTasks(tasks), "active").map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                  onChangePriority={changePriority}
                  onTogglePin={togglePinTask}
                />
              ))
            ) : (
              <EmptyState message="No active tasks" />
            )}
          </TabsContent>

          {/* Completed Tasks */}
          <TabsContent value="completed" className="space-y-2">
            {filterTasks(sortTasks(tasks), "completed").length > 0 ? (
              filterTasks(sortTasks(tasks), "completed").map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskCompletion}
                  onDelete={deleteTask}
                  onChangePriority={changePriority}
                  onTogglePin={togglePinTask}
                />
              ))
            ) : (
              <EmptyState message="No completed tasks" />
            )}
          </TabsContent>
        </Tabs>

        {/* Fixed Add Task Input at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg z-10">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              placeholder="Add a task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              className="flex-1"
            />
            <Button
              onClick={addTask}
              className="bg-[#0f172a] hover:bg-[#1e293b]"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onToggle,
  onDelete,
  onChangePriority,
  onTogglePin,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onChangePriority: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all",
        task.pinned && "border-amber-300 bg-amber-50",
        task.completed && !task.pinned
          ? "bg-gray-50 border-gray-100"
          : !task.pinned && "bg-white border-gray-200 hover:border-gray-300"
      )}
    >
      <div
        className="flex items-center gap-3 flex-1"
        onClick={() => onToggle(task.id)}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className={task.completed ? "opacity-50" : ""}
        />
        <div className="flex-1 cursor-pointer">
          <p
            className={cn(
              "text-sm font-medium transition-all",
              task.completed && "line-through text-gray-400"
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full cursor-pointer",
                priorityColors[task.priority]
              )}
              onClick={(e) => {
                e.stopPropagation();
                onChangePriority(task.id);
              }}
            >
              {task.priority}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            task.pinned
              ? "text-amber-500"
              : "text-gray-400 hover:text-amber-500"
          )}
          onClick={() => onTogglePin(task.id)}
          aria-label={task.pinned ? "Unpin task" : "Pin task"}
        >
          <Star className={cn("h-4 w-4", task.pinned && "fill-amber-500")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-red-500"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <SunMedium className="h-12 w-12 text-gray-200 mb-4" />
      <h3 className="text-lg font-medium text-gray-500 mb-1">{message}</h3>
      <p className="text-sm text-gray-400">Add a new task to get started</p>
    </div>
  );
}
