// importScripts(
//   "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
// );
// importScripts(
//   "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
// );

// const firebaseConfig = {
//   apiKey: "AIzaSyA5KiMQfj8tGmSEpvRiV9j5E004lbsnj28",
//   authDomain: "taskwisecollaborativeai.firebaseapp.com",
//   projectId: "taskwisecollaborativeai",
//   storageBucket: "taskwisecollaborativeai.firebasestorage.app",
//   messagingSenderId: "1016978477150",
//   appId: "1:1016978477150:web:1e84802c4624304be664cf",
//   measurementId: "G-749PF8J335",
// };

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// // messaging.onBackgroundMessage((payload) => {
// //   console.log(
// //     "[firebase-messaging-sw.js] Received background message: ",
// //     payload
// //   );
// //   const notificationTitle = payload.notification.title;
// //   const notificationOptions = {
// //     body: payload.notification.body,
// //     icon: "/brain (4).png",
// //   };

// //   self.registration.showNotification(notificationTitle, notificationOptions);
// // });

// self.addEventListener("push", function (event) {
//   if (event.data) {
//     const payload = event.data.json();

//     // Check if this is a Firebase Cloud Messaging payload
//     if (
//       payload.notification ||
//       (payload.data && payload.data.firebaseMessaging)
//     ) {
//       // Let Firebase handle this notification - don't create a new one
//       return;
//     }

//     // For other push messages, you can create custom notifications
//     // But for FCM, let Firebase handle it to avoid duplicates
//   }
// });

// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();

//   // Get the notification data
//   const notificationData = event.notification.data;

//   // Handle action buttons if clicked
//   if (event.action === "view") {
//     // Navigate to task detail page
//     const taskId = notificationData.taskId;
//     // clients.openWindow(`/tasks/${taskId}`);
//     clients.openWindow("/dashboard");
//     return;
//   }

//   if (event.action === "complete") {
//     // Make API call to mark task complete
//     // This would need additional implementation
//     return;
//   }

//   // Default action - navigate to dashboard
//   const urlToOpen = new URL(
//     notificationData.url || "/dashboard",
//     self.location.origin
//   ).href;

//   const promiseChain = clients
//     .matchAll({
//       type: "window",
//       includeUncontrolled: true,
//     })
//     .then((windowClients) => {
//       // Check if there is already a window open
//       for (let i = 0; i < windowClients.length; i++) {
//         const client = windowClients[i];
//         if (client.url === urlToOpen && "focus" in client) {
//           return client.focus();
//         }
//       }
//       // If no window is open, open a new one
//       if (clients.openWindow) {
//         return clients.openWindow(urlToOpen);
//       }
//     });

//   event.waitUntil(promiseChain);
// });

importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyA5KiMQfj8tGmSEpvRiV9j5E004lbsnj28",
  authDomain: "taskwisecollaborativeai.firebaseapp.com",
  projectId: "taskwisecollaborativeai",
  storageBucket: "taskwisecollaborativeai.firebasestorage.app",
  messagingSenderId: "1016978477150",
  appId: "1:1016978477150:web:1e84802c4624304be664cf",
  measurementId: "G-749PF8J335",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// This is the key part - control background notifications
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Create a customized notification
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/brain (4).png",
    badge: "/brain (4).png",
    data: payload.data || {},
    actions: [
      {
        action: "view",
        title: "View",
      },
    ],
  };

  // Return the promise to ensure FCM's default notification is prevented
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Prevent default handling by stopping the push event if it's a Firebase notification
self.addEventListener(
  "push",
  function (event) {
    // If there's no data or payload, let it go through
    if (!event.data) return;

    try {
      const payload = event.data.json();

      // Check if this is a Firebase Cloud Messaging payload
      if (
        payload.notification ||
        (payload.data && payload.data.firebaseMessaging)
      ) {
        // Important: Prevent default handling by stopping the event propagation
        // This prevents the browser from automatically creating a notification
        event.stopImmediatePropagation();

        // We must call event.waitUntil() with a valid promise to properly handle the event
        event.waitUntil(Promise.resolve());
      }
    } catch (e) {
      console.error("Error handling push event:", e);
    }
  },
  true
); // The 'true' parameter is crucial - it makes this listener run before others

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the notification data
  const notificationData = event.notification.data;

  // Handle action buttons if clicked
  if (event.action === "view") {
    // Navigate to task detail page
    clients.openWindow("/dashboard");
    return;
  }

  if (event.action === "complete") {
    // Make API call to mark task complete
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
