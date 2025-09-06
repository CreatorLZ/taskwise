import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "@/store/authstore";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (token) {
    // If user is logged in, redirect to their intended destination or dashboard
    return <Navigate to={from} replace />;
  }

  return <div className="font-space-grotesk">{children}</div>;
};

export default PublicRoute;
