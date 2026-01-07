// firebase.ts
// LAZY-LOADED Firebase Messaging to prevent Chrome's Local Network Access prompt
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  MessagePayload,
  onMessage,
  Messaging,
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

// Lazy initialization - only initialize when needed
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let isInitialized = false;

// Initialize Firebase app (safe, doesn't trigger LNA prompt)
const getFirebaseApp = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

// Initialize messaging ONLY when explicitly called (triggers LNA prompt)
const initializeMessaging = async (): Promise<Messaging | null> => {
  if (messaging) return messaging;

  try {
    // Register service worker first
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    }

    const firebaseApp = getFirebaseApp();
    messaging = getMessaging(firebaseApp);
    isInitialized = true;
    return messaging;
  } catch (error) {
    console.error("Failed to initialize Firebase messaging:", error);
    return null;
  }
};

// Function to request notification permission and get FCM token
// This is the ONLY entry point that should trigger browser prompts
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Only now do we initialize messaging (triggers LNA if needed)
      const messagingInstance = await initializeMessaging();
      if (!messagingInstance) {
        console.error("Failed to initialize messaging");
        return null;
      }

      const currentToken = await getToken(messagingInstance, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
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

// Setup foreground message listener - only works after messaging is initialized
export const setupMessageListener = (
  callback: (payload: MessagePayload) => void
) => {
  if (!messaging) {
    console.warn(
      "Messaging not initialized. Call requestNotificationPermission first."
    );
    return;
  }
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Legacy export for backward compatibility (does nothing now until initialized)
export const onMessageListener = (
  callback: (payload: MessagePayload) => void
) => {
  // If messaging is already initialized, set up listener immediately
  if (messaging) {
    onMessage(messaging, callback);
  } else {
    // Store callback to be called after initialization
    // For now, we'll just warn - the NotificationPrompt will handle this
    console.log(
      "Firebase messaging will be initialized when user enables notifications"
    );
  }
};

// Check if messaging is ready
export const isMessagingInitialized = () => isInitialized;

export default getFirebaseApp;
