importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyA5KiMQfj8tGmSEpvRiV9j5E004lbsnj28",
  authDomain: "taskwisecollaborativeai.firebaseapp.com",
  projectId: "taskwisecollaborativeai",
  messagingSenderId: "1016978477150",
  appId: "1:1016978477150:web:1e84802c4624304be664cf",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification.title;

  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    requireInteraction: false,
    timestamp: Date.now(),
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const taskUrl = event.notification.data?.taskUrl || "/";
  clients.openWindow(taskUrl);
});
