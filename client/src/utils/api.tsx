import useAuthStore from "@/store/authstore";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  // baseURL: "https://taskwise-wibu.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
