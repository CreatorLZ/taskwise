import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import api from "@/utils/api";
import useAuthStore from "@/store/authstore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const messaging: Messaging = getMessaging(app);

// Component to handle notifications
export const NotificationHandler: React.FC = () => {
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Get FCM token
        const fcmToken = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
        });

        // Send token to your backend
        const userId = useAuthStore((state) => state.userId);
        const authToken = useAuthStore((state) => state.token);
        await api.put(
          "/users/update-fcm-token",
          {
            userId,
            fcmToken,
          },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Handle incoming messages when app is in foreground
  onMessage(messaging, (payload) => {
    console.log("Received foreground message:", payload);
    // You can show a custom notification UI here
    new Notification(payload.notification?.title || "Notification", {
      body: payload.notification?.body,
    });
  });

  return (
    <button
      onClick={requestNotificationPermission}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Enable Notifications
    </button>
  );
};

export { app, messaging };
