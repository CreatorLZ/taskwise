import useAuthStore from "@/store/authstore";
import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  // baseURL: "https://taskwise-wibu.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  // console.log(
  //   "Request interceptor: token present?",
  //   !!token,
  //   "URL:",
  //   config.url
  // );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log("Authorization header set");
  }
  return config;
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Response interceptor error:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
    });
    if (error.response && error.response.status === 401) {
      console.log("Token expiration detected, clearing auth state");
      // Clear auth state and redirect to login
      const logout = useAuthStore.getState().logout;
      logout();

      // Show notification (using toast instead of alert)
      if (typeof window !== "undefined") {
        toast.dismiss(); // Dismiss existing toasts
        toast.error("Session expired. Please log in again.", {
          duration: 4000,
          position: "top-center",
        });

        // Use sessionStorage to persist the message across redirect if needed
        sessionStorage.setItem("sessionExpired", "true");

        // Redirect to login
        // setTimeout to allow toast to render? standard redirect wipes it.
        // The storage item "sessionExpired" is the best way, handled in Login page.
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
