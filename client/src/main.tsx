import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Landing from "./Pages/Landing.tsx";
import "./global.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TaskDashboard from "./Pages/Dashboard.tsx";
import RegisterPage from "./Pages/Register.tsx";
import LoginPage from "./Pages/Login.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ProtectedRoute from "./ProtectedRoute.tsx";
import { DashboardLayout } from "./components/dashboardLayout.tsx";
import PublicRoute from "./PublicRoute.tsx";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import TodoList from "./Pages/TodoList.tsx";

// NOTE: Firebase messaging is now lazy-loaded in NotificationPrompt.tsx
// This prevents Chrome's "Local Network Access" prompt from appearing on page load

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
    path: "/todo",
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <TodoList />
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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
          <Analytics />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
      </HelmetProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
