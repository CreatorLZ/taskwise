import useAuthStore from "@/store/authstore";
import axios from "axios";

const endpoints = [
  "http://localhost:3000/api", // for local development
  "https://taskwise-wibu.onrender.com/api",
];

const api = axios.create({
  baseURL: endpoints[2], // Change the index based on the environment
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
