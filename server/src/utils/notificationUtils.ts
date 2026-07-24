import type { ServiceAccount } from "firebase-admin";
import type { Messaging } from "firebase-admin/messaging";

let _messaging: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging> {
  if (_messaging) return _messaging;

  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getMessaging } = await import("firebase-admin/messaging");
  const admin = await import("firebase-admin");

  const serviceAccount: Record<string, unknown> = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  _messaging = admin.messaging();
  return _messaging;
}

// Function to send push notification
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const message = {
      android: {
        notification: {
          icon: "brain",
          color: "#4285F4",
          clickAction: "OPEN_DASHBOARD_ACTIVITY",
          channelId: "task_reminders",
        },
      },
      webpush: {
        notification: {
          title, // Title moved here
          body, // Body moved here
          icon: "/brain.png",
          badge: "/badge-icon.png",
          actions: [
            {
              action: "view",
              title: "View Task",
            },
            {
              action: "complete",
              title: "Mark Complete",
            },
          ],
          // This ensures the notification is handled properly
          requireInteraction: true,
          // Add a tag to prevent duplicate notifications for the same task
          tag: data?.taskId || "task-reminder",
          // Vibration pattern (milliseconds)
          vibrate: [200, 100, 200],
          data: {
            url: "/dashboard", // URL to navigate to when notification is clicked
          },
        },
        fcmOptions: {
          link: "/dashboard",
        },
      },
      token: fcmToken,
      data: {
        ...data,
        url: "/dashboard",
        taskId: data?.taskId || "",
        clickAction: "OPEN_DASHBOARD",
      },
    };

    const response = await (await getMessagingInstance()).send(message);
    console.log("Successfully sent notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
