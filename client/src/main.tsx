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
import { toast, Toaster } from "sonner";
import { onMessageListener } from "./firebase.ts";
import { Bell } from "lucide-react";

// Firebase Cloud Messaging foreground message handler

// onMessageListener((payload) => {
//   console.log("Message received. ", payload);
//   toast(payload?.notification?.title, {
//     description: payload?.notification?.body,
//     icon: <Bell className="size-5" />,
//     duration: 5000,
//   });
// });

// In main.tsx, replace your current onMessageListener code with this:
onMessageListener((payload) => {
  console.log("Message received. ", payload);

  // Check if we're on Android
  if (/Android/i.test(navigator.userAgent)) {
    // For Android, use the service worker to show notifications
    if (
      "serviceWorker" in navigator &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        // Create notification through service worker
        registration.showNotification(
          payload?.notification?.title || "Taskwise",
          {
            body: payload?.notification?.body || "No Body",
            icon: "/brain (4).png",
            badge: "/brain (4).png",
            data: payload.data || {},
          }
        );
      });
    } else {
      // Fallback to toast if notifications not available
      toast(payload?.notification?.title, {
        description: payload?.notification?.body,
        icon: <Bell className="size-5" />,
        duration: 5000,
      });
    }
  } else {
    // For non-Android platforms, use toast
    toast(payload?.notification?.title, {
      description: payload?.notification?.body,
      icon: <Bell className="size-5" />,
      duration: 5000,
    });
  }
});

// Register Firebase Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered successfully:", registration);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}

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
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
