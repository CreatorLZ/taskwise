// firebase.ts
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  MessagePayload,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to request notification permission and get FCM token
// export const requestNotificationPermission = async () => {
//   try {
//     const permission = await Notification.requestPermission();
//     if (permission === "granted") {
//       const currentToken = await getToken(messaging, {
//         vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
//       });

//       if (currentToken) {
//         return currentToken;
//       } else {
//         console.log("No registration token available.");
//         return null;
//       }
//     } else {
//       console.log("Notification permission denied");
//       return null;
//     }
//   } catch (err) {
//     console.error("An error occurred while retrieving token:", err);
//     return null;
//   }
// };

export const requestNotificationPermission = async () => {
  try {
    // Check for service worker support first
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return null;
    }

    // Check for notification support
    if (!("Notification" in window)) {
      console.log("Notifications not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Make sure service worker is ready before getting token
      await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration:
          await navigator.serviceWorker.getRegistration(
            "/firebase-messaging-sw.js"
          ),
      });

      if (currentToken) {
        console.log("Token obtained successfully:", currentToken);
        return currentToken;
      } else {
        console.log("No registration token available.");
        return null;
      }
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token:", err);
    return null;
  }
};

export const onMessageListener = (
  callback: (payload: MessagePayload) => void
) => {
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};

export default app;
