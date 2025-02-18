import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "@/store/authstore";
import { useEffect } from "react";
import useTaskStore from "./store/taskStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  // Clear any stale state if no token is present
  useEffect(() => {
    if (!token) {
      useAuthStore.getState().logout();
      useTaskStore.getState().clearTasks();
    }
  }, [token]);

  if (!token) {
    // Redirect to landing if there's no token, preserving the intended destination
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
