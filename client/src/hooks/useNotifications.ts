// src/hooks/useNotifications.ts
import { useState } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebase";
import api from "../utils/api";
// import useNotificationStore from '../store/notificationStore';
import useAuthStore from "../store/authstore";
import useNotificationStore from "./useNotificationStore";

export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEnabled = useNotificationStore((state) => state.setEnabled);
  const setFCMToken = useNotificationStore((state) => state.setFCMToken);
  const userId = useAuthStore((state) => state.userId);
  const authToken = useAuthStore((state) => state.token);

  const enableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
        });

        if (fcmToken && userId && authToken) {
          await api.put(
            "/users/update-fcm-token",
            { userId, fcmToken },
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          setFCMToken(fcmToken);
          setEnabled(true);
          return true;
        }
      }

      setError("Notification permission denied");
      return false;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setError("Failed to enable notifications");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    enableNotifications,
  };
}
