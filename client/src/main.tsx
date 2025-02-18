import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Landing from "./Pages/Landing.tsx";
import "./global.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TaskDashboard from "./Pages/Dashboard.tsx";
import RegisterPage from "./Pages/Register.tsx";
import LoginPage from "./Pages/Login.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ProtectedRoute from "./ProtectedRoute.tsx";
import { DashboardLayout } from "./components/dashboardLayout.tsx";
import PublicRoute from "./PublicRoute.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <Landing />
      </PublicRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <TaskDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
