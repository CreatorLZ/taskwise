importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener("push", function (event) {
  if (event.data) {
    const payload = event.data.json();

    // Check if this is a Firebase Cloud Messaging payload
    if (
      payload.notification ||
      (payload.data && payload.data.firebaseMessaging)
    ) {
      // Let Firebase handle this notification - don't create a new one
      return;
    }

    // For other push messages, you can create custom notifications
    // But for FCM, let Firebase handle it to avoid duplicates
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the notification data
  const notificationData = event.notification.data;

  // Handle action buttons if clicked
  if (event.action === "view") {
    // Navigate to task detail page
    const taskId = notificationData.taskId;
    // clients.openWindow(`/tasks/${taskId}`);
    clients.openWindow("/dashboard");
    return;
  }

  if (event.action === "complete") {
    // Make API call to mark task complete
    // This would need additional implementation
    return;
  }

  // Default action - navigate to dashboard
  const urlToOpen = new URL(
    notificationData.url || "/dashboard",
    self.location.origin
  ).href;

  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Check if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});
