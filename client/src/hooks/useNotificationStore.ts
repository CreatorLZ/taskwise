import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationState {
  isEnabled: boolean;
  fcmToken: string | null;
  setEnabled: (enabled: boolean) => void;
  setFCMToken: (token: string | null) => void;
}

const useNotificationStore = create(
  persist<NotificationState>(
    (set) => ({
      isEnabled: false,
      fcmToken: null,
      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setFCMToken: (token) => set({ fcmToken: token }),
    }),
    {
      name: "notification-storage",
    }
  )
);

export default useNotificationStore;
