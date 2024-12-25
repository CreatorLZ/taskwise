import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Task {
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

interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const useTaskStore = create(
  persist<TaskStore>(
    (set) => ({
      tasks: [],
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: "task-storage",
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        },
        setItem: (key, value) => {
          localStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
        },
      },
    }
  )
);

export default useTaskStore;

export function useFetchTasks(userId: string) {
  const setTasks = useTaskStore((state) => state.setTasks);

  return useQuery({
    queryKey: ["tasks", userId],
    queryFn: async () => {
      const response = await api.get(`/tasks/user/${userId}`);
      setTasks(response.data);
      return response.data as Task[];
    },
    staleTime: 5000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async (taskData: Omit<Task, "_id">) => {
      const response = await api.post("/tasks", taskData);
      return response.data as Task;
    },
    onSuccess: (newTask) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      // Update Zustand store
      const currentTasks = useTaskStore.getState().tasks;
      setTasks([...currentTasks, newTask]);
    },
    onError: (error) => {
      console.error("Error creating task:", error);
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => {
      const response = await api.patch(`/tasks/${taskId}`, updates);
      return response.data as Task;
    },
    onSuccess: (updatedTask) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      // Update Zustand store
      const currentTasks = useTaskStore.getState().tasks;
      setTasks(
        currentTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    },
    onError: (error) => {
      console.error("Error updating task:", error);
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: (taskId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      // Update Zustand store
      const currentTasks = useTaskStore.getState().tasks;
      setTasks(currentTasks.filter((task) => task._id !== taskId));
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
    },
  });
}
