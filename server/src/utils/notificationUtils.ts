import admin from "../config/firebaseConfig";

// notificationUtils.ts
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  message: string,
  data?: Record<string, string>
) => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Task reminder",
        body: message,
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      android: {
        notification: {
          icon: "@drawable/ic_notification",
          color: "#4CAF50",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
            "content-available": 1,
            sound: "default",
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          vibrate: [200, 100, 200],
          requireInteraction: false,
          actions: [
            {
              action: "view",
              title: "View Task",
            },
          ],
        },
        fcmOptions: {
          link: "https://yourdomain.com/tasks",
        },
      },
    });
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
