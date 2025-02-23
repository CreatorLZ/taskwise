import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";
import api from "@/utils/api";
import useAuthStore from "@/store/authstore";
import { useQueryClient } from "@tanstack/react-query";
import useTaskStore from "@/store/taskStore";
import { requestNotificationPermission } from "@/firebase.ts";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Zustand store actions
  const setUser = useAuthStore((state) => state.setUser);
  const setUserId = useAuthStore((state) => state.setUserId);
  const setToken = useAuthStore((state) => state.setToken);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setAIEnabled = useTaskStore((state) => state.setAIEnabled);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null); // Clear any previous errors

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user, userId } = response.data;

      setUser(user);
      setToken(token);
      setUserId(userId);
      setAIEnabled(user.taskAnalysisSchedule.enabled);

      // Request notification permission and get FCM token
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        // Update user's FCM token in backend
        await api.put("/users/update-fcm-token", {
          userId,
          fcmToken,
        });
        console.log(fcmToken);
      }

      const clearTasks = useTaskStore.getState().clearTasks;
      clearTasks();

      // Prefetch tasks after successful login
      await queryClient.prefetchQuery({
        queryKey: ["tasks", userId],
        queryFn: async () => {
          const response = await api.get(`/tasks/user/${userId}`);
          setTasks(response.data);
          return response.data;
        },
      });

      // Navigate to user dashboard
      navigate("/dashboard");
    } catch (error: any) {
      // Handle API errors
      const errorResponse = error?.response?.data?.message || "Login failed";
      console.log(error);
      setErrorMessage(errorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            TaskWise Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
