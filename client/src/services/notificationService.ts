import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { messaging } from "../firebase";
import api from "../utils/api";

interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  actions?: { action: string; title: string }[];
  timestamp?: number;
  vibrate?: number[];
}

interface NotificationServiceConfig {
  vapidKey: string;
  defaultIcon: string;
  defaultBadge: string;
}

class NotificationService {
  private static instance: NotificationService;
  private config: NotificationServiceConfig;
  private initialized: boolean = false;

  private constructor(config: NotificationServiceConfig) {
    this.config = config;
  }

  static getInstance(config: NotificationServiceConfig): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(config);
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          {
            scope: "/",
          }
        );
        console.log("Service Worker registered:", registration);
      }
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return false;
    }
  }

  async requestPermission(): Promise<{ granted: boolean; token?: string }> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await this.getFCMToken();
        if (token) {
          return { granted: true, token };
        } else {
          return { granted: false };
        }
      }
      return { granted: false };
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return { granted: false };
    }
  }

  private async getFCMToken(): Promise<string | null> {
    try {
      return await getToken(messaging, {
        vapidKey: this.config.vapidKey,
      });
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  async updateFCMToken(userId: string, authToken: string): Promise<boolean> {
    const fcmToken = await this.getFCMToken();
    if (!fcmToken) return false;

    try {
      await api.put(
        "/users/update-fcm-token",
        { userId, fcmToken },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return true;
    } catch (error) {
      console.error("Error updating FCM token:", error);
      return false;
    }
  }

  setupForegroundHandler() {
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      const options: ExtendedNotificationOptions = {
        body,
        icon: this.config.defaultIcon,
        badge: this.config.defaultBadge,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        timestamp: Date.now(),
      };

      if (Notification.permission === "granted") {
        new Notification(title || "New Notification", options);
      }
    });
  }
}

export default NotificationService;
