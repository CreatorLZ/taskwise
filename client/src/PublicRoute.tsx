import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "./store/authstore";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (token) {
    // If user is logged in, redirect to dashboard or their intended destination
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default PublicRoute;
