import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  userId: string | null;
  setAuth: (auth: { user: AuthUser; token: string; userId: string }) => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
  setUserId: (userId: string) => void;
  logout: () => void;
}

export interface AuthUser {
  _id?: string;
  username: string;
  email: string;
  avatar?: string;
  emailVerified?: boolean;
  taskAnalysisSchedule?: {
    firstRunTime?: string;
    secondRunTime?: string;
    enabled?: boolean;
  };
  authProvider?: "local" | "google";
}

const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      token: null,
      userId: null,
      setAuth: ({ user, token, userId }) => set({ user, token, userId }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setUserId: (userId) => set({ userId }),
      logout: () => set({ user: null, token: null, userId: null }),
    }),
    {
      name: "auth-storage",
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

export default useAuthStore;
