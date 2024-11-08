import admin from "../config/firebaseConfig";

export const sendPushNotification = async (
  fcmToken: string,
  message: string
) => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: "Task Reminder",
        body: message,
      },
    });
    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
