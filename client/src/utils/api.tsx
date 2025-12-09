import useAuthStore from "@/store/authstore";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  // baseURL: "https://taskwise-wibu.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  console.log(
    "Request interceptor: token present?",
    !!token,
    "URL:",
    config.url
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Authorization header set");
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
      // Show notification (using alert for simplicity, replace with your UI notification system if available)
      if (typeof window !== "undefined") {
        alert("Login Session expired. Please log in again.");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
