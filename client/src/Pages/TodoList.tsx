"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ListTodo,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Priority = "Low" | "Medium" | "High";
type Filter = "open" | "all" | "pinned" | "completed";
type SortMode = "created" | "priority" | "title";

type TodoTask = {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  pinned: boolean;
};

const STORAGE_KEY = "taskwise.todos";
const LEGACY_STORAGE_KEY = "tasks";

const priorityRank: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const priorityDot: Record<Priority, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-500",
};

const readStoredTasks = (): TodoTask[] => {
  if (typeof window === "undefined") return [];

  const rawTasks =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!rawTasks) return [];

  try {
    const parsed = JSON.parse(rawTasks);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((task) => typeof task?.title === "string")
      .map((task) => ({
        id: String(task.id || crypto.randomUUID()),
        title: task.title,
        completed: Boolean(task.completed),
        priority: ["Low", "Medium", "High"].includes(task.priority)
          ? task.priority
          : "Medium",
        createdAt: task.createdAt
          ? new Date(task.createdAt).toISOString()
          : new Date().toISOString(),
        pinned: Boolean(task.pinned),
      }));
  } catch {
    return [];
  }
};

const formatDay = () =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

export default function TodoList() {
  const [tasks, setTasks] = useState<TodoTask[]>(readStoredTasks);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [sortMode, setSortMode] = useState<SortMode>("created");
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const openCount = useMemo(
    () => tasks.filter((task) => !task.completed).length,
    [tasks]
  );

  const completedCount = tasks.length - openCount;

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch = !query || task.title.toLowerCase().includes(query);
        const matchesFilter =
          filter === "all" ||
          (filter === "open" && !task.completed) ||
          (filter === "completed" && task.completed) ||
          (filter === "pinned" && task.pinned);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        if (sortMode === "priority") {
          return priorityRank[b.priority] - priorityRank[a.priority];
        }

        if (sortMode === "title") {
          return a.title.localeCompare(b.title);
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [filter, searchQuery, sortMode, tasks]);

  const openTasks = visibleTasks.filter((task) => !task.completed);
  const completedTasks = visibleTasks.filter((task) => task.completed);

  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;

    setTasks((currentTasks) => [
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        priority: newPriority,
        createdAt: new Date().toISOString(),
        pinned: false,
      },
      ...currentTasks,
    ]);
    setNewTask("");
    setFilter("open");
  };

  const updateTask = (id: string, updates: Partial<TodoTask>) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  };

  return (
    <main className="min-h-screen bg-muted/30 px-3 py-4 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header className="rounded-lg border bg-card px-4 py-4 shadow-sm sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ListTodo className="h-4 w-4" />
                <span className="text-sm">{formatDay()}</span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Todo</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {openCount} open · {completedCount} completed
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchOpen((value) => !value)}
                aria-label="Search todos"
              >
                <Search className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Todo options"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortMode("created")}>
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("priority")}>
                    Priority first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortMode("title")}>
                    A to Z
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearCompleted}>
                    Clear completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {searchOpen && (
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="h-10 pl-9 pr-9"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </header>

        <section className="rounded-lg border bg-card p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                value={newTask}
                onChange={(event) => setNewTask(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
                placeholder="Add a task"
                className="h-11 border-0 pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={newPriority}
                onValueChange={(value: Priority) => setNewPriority(value)}
              >
                <SelectTrigger className="h-11 w-[126px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addTask} className="h-11 px-4">
                Add
              </Button>
            </div>
          </div>
        </section>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          <FilterButton
            active={filter === "open"}
            label="Open"
            count={openCount}
            onClick={() => setFilter("open")}
          />
          <FilterButton
            active={filter === "all"}
            label="All"
            count={tasks.length}
            onClick={() => setFilter("all")}
          />
          <FilterButton
            active={filter === "pinned"}
            label="Pinned"
            count={tasks.filter((task) => task.pinned).length}
            onClick={() => setFilter("pinned")}
          />
          <FilterButton
            active={filter === "completed"}
            label="Completed"
            count={completedCount}
            onClick={() => setFilter("completed")}
          />
        </nav>

        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          {visibleTasks.length === 0 ? (
            <EmptyState hasSearch={Boolean(searchQuery)} />
          ) : (
            <div className="divide-y">
              {openTasks.map((task) => (
                <TodoRow
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                />
              ))}

              {completedTasks.length > 0 && filter !== "open" && (
                <div>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-accent/50"
                    onClick={() => setShowCompleted((value) => !value)}
                  >
                    <span>Completed</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        !showCompleted && "-rotate-90"
                      )}
                    />
                  </button>
                  {showCompleted &&
                    completedTasks.map((task) => (
                      <TodoRow
                        key={task.id}
                        task={task}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className="h-9 shrink-0 gap-2 rounded-full"
      onClick={onClick}
    >
      {label}
      <Badge
        variant={active ? "secondary" : "outline"}
        className="h-5 rounded-full px-1.5"
      >
        {count}
      </Badge>
    </Button>
  );
}

function TodoRow({
  task,
  onUpdate,
  onDelete,
}: {
  task: TodoTask;
  onUpdate: (id: string, updates: Partial<TodoTask>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40",
        task.completed && "bg-muted/20"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) =>
          onUpdate(task.id, { completed: Boolean(checked) })
        }
        aria-label={`Mark ${task.title} as complete`}
      />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <p
            className={cn(
              "truncate text-sm font-medium",
              task.completed && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("h-2 w-2 rounded-full", priorityDot[task.priority])} />
          <span>{task.priority}</span>
          {task.pinned && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", task.pinned && "text-primary")}
          onClick={() => onUpdate(task.id, { pinned: !task.pinned })}
          aria-label={task.pinned ? "Unpin task" : "Pin task"}
        >
          <Star className={cn("h-4 w-4", task.pinned && "fill-current")} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label="Task options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                onUpdate(task.id, { completed: !task.completed })
              }
            >
              <Check className="mr-2 h-4 w-4" />
              {task.completed ? "Mark open" : "Mark done"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdate(task.id, { priority: "High" })}
            >
              High priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdate(task.id, { priority: "Medium" })}
            >
              Medium priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onUpdate(task.id, { priority: "Low" })}
            >
              Low priority
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ListTodo className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold">
        {hasSearch ? "No matching tasks" : "Nothing here"}
      </h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {hasSearch
          ? "Clear the search or try a different filter."
          : "Add a task above and keep the list moving."}
      </p>
    </div>
  );
}
