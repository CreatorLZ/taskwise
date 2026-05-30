import useAuthStore from "@/store/authstore";
import axios from "axios";
import { toast } from "sonner";

const baseURL =
  import.meta.env.VITE_ENVIRONMENT === "production"
    ? "https://taskwise-wibu.onrender.com/api"
    : "http://localhost:3000/api";

const api = axios.create({
  baseURL,
});

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/googlelogin",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];

const isAuthRoute = (url?: string) =>
  !!url && AUTH_ROUTES.some((route) => url.includes(route));

let hasRedirectedForExpiredSession = false;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const requestUrl = error.config?.url;
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);
    const shouldEndSession =
      status === 401 &&
      hadAuthHeader &&
      !isAuthRoute(requestUrl) &&
      ["Token is not valid", "User not found", "No token, authorization denied"].includes(
        message
      );

    if (shouldEndSession && !hasRedirectedForExpiredSession) {
      hasRedirectedForExpiredSession = true;
      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        toast.dismiss();
        toast.error("Session expired. Please log in again.", {
          duration: 4000,
          position: "top-center",
        });

        sessionStorage.setItem("sessionExpired", "true");
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
