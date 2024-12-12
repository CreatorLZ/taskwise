import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/utils/api";

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

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchTasks: (userId: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
}

const useTaskStore = create(
  persist<TaskStore>(
    (set) => ({
      tasks: [],
      isLoading: false,
      errorMessage: null,

      fetchTasks: async (userId) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const response = await api.get(`/tasks/user/${userId}`);
          set({ tasks: response.data || [] });
        } catch (error: any) {
          set({
            errorMessage:
              error.response?.data?.message ||
              "Failed to load tasks. Please try again.",
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      setTasks: (tasks) => {
        set({ tasks });
      },
    }),
    {
      name: "task-storage", // Key in localStorage
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
