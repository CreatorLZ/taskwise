// import { useEffect } from "react";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { app } from "@/firebase";
// import api from "@/utils/api";
// import useAuthStore from "@/store/authstore";
// import { AlertCircle } from "lucide-react";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// interface ExtendedNotificationOptions extends NotificationOptions {
//   image?: string;
//   actions?: { action: string; title: string }[];
//   timestamp?: number;
//   vibrate?: number[];
// }

// const NotificationHandler = () => {
//   const userId = useAuthStore((state) => state.userId);
//   const authToken = useAuthStore((state) => state.token);
//   const messaging = getMessaging(app);

//   const setupNotifications = async () => {
//     try {
//       if (!("Notification" in window)) {
//         console.log("This browser does not support notifications");
//         return;
//       }

//       // Register service worker
//       if ("serviceWorker" in navigator) {
//         try {
//           const registration = await navigator.serviceWorker.register(
//             "/firebase-messaging-sw.js",
//             {
//               scope: "/",
//             }
//           );
//           console.log("Service Worker registered:", registration);
//         } catch (err) {
//           console.error("Service Worker registration failed:", err);
//           return;
//         }
//       }

//       // Request permission
//       const permission = await Notification.requestPermission();
//       console.log("Notification permission:", permission);

//       if (permission === "granted") {
//         // Get FCM token
//         const fcmToken = await getToken(messaging, {
//           vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY as string,
//         });

//         if (fcmToken && userId && authToken) {
//           console.log("FCM Token:", fcmToken);

//           // Update token in backend
//           await api.put(
//             "/users/update-fcm-token",
//             { userId, fcmToken },
//             {
//               headers: {
//                 Authorization: `Bearer ${authToken}`,
//               },
//             }
//           );
//           console.log("FCM token updated in backend");
//         }
//       }
//     } catch (error) {
//       console.error("Error setting up notifications:", error);
//       return (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertTitle>Error</AlertTitle>
//           <AlertDescription>
//             Failed to set up notifications. Please try again later.
//           </AlertDescription>
//         </Alert>
//       );
//     }
//   };

//   useEffect(() => {
//     if (userId && authToken) {
//       setupNotifications();
//     }

//     // Handle foreground messages
//     const unsubscribe = onMessage(messaging, (payload) => {
//       console.log("Received foreground message:", payload);

//       if (Notification.permission === "granted") {
//         const { title, body, image } = payload.notification || {};
//         const options: ExtendedNotificationOptions = {
//           body,
//           icon: "/icon-192x192.png",
//           badge: "/icon-192x192.png",
//           image,
//           vibrate: [200, 100, 200],
//           requireInteraction: false,
//           timestamp: Date.now(),
//           actions: [
//             {
//               action: "view",
//               title: "View Task",
//             },
//           ],
//         };

//         new Notification(title || "New Notification", options);
//       }
//     });

//     return () => unsubscribe();
//   }, [userId, authToken, messaging]);

//   return null;
// };

// export default NotificationHandler;
