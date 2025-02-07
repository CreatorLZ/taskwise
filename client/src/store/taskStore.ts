import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Task {
  _id: string;
  title: string;
  category: string;
  priority: string;
  previousPriority?: string;
  progress: number;
  dueTime: string;
  dueDate: string;
  formattedDueDate: string;
  description: string;
  status: string;
  completed?: boolean;
}

interface TaskStore {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  clearTasks: () => void;
}

const useTaskStore = create(
  persist<TaskStore>(
    (set) => ({
      tasks: [],
      setTasks: (tasks) => set({ tasks: tasks || [] }),
      clearTasks: () => set({ tasks: [] }),
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
      console.log(response.data);
      return response.data;
    },
    staleTime: 5000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async (taskData: Partial<Omit<Task, "_id">>) => {
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

export function useCreateNLPTaskMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async (command: string) => {
      const response = await api.post("/create-from-nlp", { command });
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
      console.error("Error creating NLP task:", error);
      throw error; // Propagate error to component
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

export function useAIPrioritizeTasksMutation() {
  const queryClient = useQueryClient();
  const setTasks = useTaskStore((state) => state.setTasks);

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post("/prioritize-tasks", { userId });
      return response.data as Task[];
    },
    onSuccess: (updatedTasks) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });

      // Update Zustand store with updated tasks
      setTasks(updatedTasks);
      console.log(updatedTasks + " updated");
    },
    onError: (error) => {
      console.error("Error with AI task prioritization:", error);
      throw error; // Propagate error to component
    },
  });
}
