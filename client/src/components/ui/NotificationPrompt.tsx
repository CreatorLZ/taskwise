import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requestNotificationPermission } from "@/firebase";
import api from "@/utils/api";
import useAuthStore from "@/store/authstore";

const NOTIFICATION_PROMPT_KEY = "notificationPromptDismissed";

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const userId = useAuthStore((state) => state.userId);

  useEffect(() => {
    // Check if user has already dismissed the prompt or granted permission
    const isDismissed = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
    const hasPermission = Notification.permission === "granted";

    if (
      !isDismissed &&
      !hasPermission &&
      Notification.permission !== "denied"
    ) {
      // Show prompt after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken && userId) {
        await api.put("/users/update-fcm-token", {
          userId,
          fcmToken,
        });
      }
      setIsVisible(false);
      localStorage.setItem(NOTIFICATION_PROMPT_KEY, "true");
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="w-80 shadow-lg border-primary/20">
        <CardHeader className="pb-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base">Stay Updated</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription className="text-sm">
            Enable notifications to get reminders about your tasks and never
            miss a deadline.
          </CardDescription>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isRequesting}
              className="flex-1"
            >
              {isRequesting ? "Enabling..." : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
