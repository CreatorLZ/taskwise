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

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message: ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/brain.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
