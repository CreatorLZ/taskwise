import { useGoogleLogin, useGoogleOAuth } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/utils/api";
import useAuthStore from "@/store/authstore";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import useTaskStore from "@/store/taskStore";
import { AxiosError } from "axios";

interface GoogleSignInButtonProps {
  className?: string;
  onError?: (error: string) => void;
}

const GoogleSignInButton = ({
  className = "",
  onError,
}: GoogleSignInButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { scriptLoadedSuccessfully } = useGoogleOAuth();

  const setAuth = useAuthStore((state) => state.setAuth);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setAIEnabled = useTaskStore((state) => state.setAIEnabled);

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${codeResponse.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to get user info from Google");
        }

        const userData = await response.json();

        const authResponse = await api.post("/auth/googlelogin", {
          googleUser: userData,
        });

        const { token, user, userId } = authResponse.data;

        setAuth({ user, token, userId });
        setAIEnabled(Boolean(user.taskAnalysisSchedule?.enabled));

        const clearTasks = useTaskStore.getState().clearTasks;
        clearTasks();

        queryClient
          .prefetchQuery({
            queryKey: ["tasks", userId],
            queryFn: async () => {
              const response = await api.get(`/tasks/user/${userId}`);
              setTasks(Array.isArray(response.data) ? response.data : []);
              return response.data;
            },
          })
          .catch((error) => {
            console.warn("Task prefetch failed after Google login:", error);
          });

        navigate("/dashboard");
      } catch (error: unknown) {
        console.error("Google authentication error:", error);
        onError?.(
          error instanceof AxiosError
            ? error.response?.data?.message || "Authentication failed"
            : "Authentication failed"
        );
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google login error:", errorResponse);
      if (errorResponse.error === "access_denied") {
        onError?.("Google sign-in was denied");
      } else if (errorResponse.error === "unauthorized_client") {
        onError?.("Google sign-in is not configured properly");
      } else {
        onError?.("Google authentication failed");
      }
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error("Google non-OAuth error:", nonOAuthError);
      if (nonOAuthError.type === "popup_failed_to_open") {
        onError?.("Popup was blocked. Please allow popups for this site and try again.");
      } else if (nonOAuthError.type === "popup_closed") {
        onError?.("Sign-in was cancelled.");
      } else {
        onError?.("Google sign-in encountered an error. Please try again.");
      }
    },
  });

  const isDisabled = isLoading || !scriptLoadedSuccessfully;

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={() => googleLogin()}
      disabled={isDisabled}
    >
      {!scriptLoadedSuccessfully ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="18px"
            height="18px"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          Sign in with Google
        </>
      )}
    </Button>
  );
};

export default GoogleSignInButton;
