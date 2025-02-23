import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { ServiceAccount } from "firebase-admin";

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "taskwisecollaborativeai",
  private_key_id: "1fc0a4ddce46f7a920c9ebbd4eba37968ae1270c",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC4JAK8WZCuz6FY\nlBHDf9gCwPrJ/nNLZqcwDDEI9RJSJvMIckPDIS8tid0vlRuvH4QtJIgJw9gAsr4j\nhvhOhM6+BS9uEkk6iywPo7Dbzycgy57GowgOvJ6I+4jwY2fgEoXqyQZW+aknJalz\nV9Kt6cWw/T3idLz1b00D1jQAKUAcBFBZXbHEPhowfcom5vPM+TLo0kRDrvr/ygq7\n+KurT0n+VRfvqEEVkFIWyTxbocJ09r5qptonUWzrlkod7AoIbHGI6ddBFWxBO+ZW\n27AYrlNpWNFlzgFCzoRmXrlCgnASreOBLIBH1AtmLjaq1HQy/A9oFpl5FV4qsWZA\nAn25E7OTAgMBAAECggEAU8Ghcu2kVzc+8uzqxYtVhC8mA5HW/HF1U3AAL8xVKIPp\n4Koks1FZRbPjJT0D6hyCQQxQSmzHx82FmeBO+lwDM8BlCgKMR3I9OOHiVKD9cbfc\ngQpv5FAcJj+PUpRMj8mtGxWT6iTGMXW6hSnpvMxL7QzLRMGHn3WgSMH6RiZ9MCBo\nAq7lunaGjIDlLv64T7pHAgj38nbtgQv/R3N2/CvWS3MxY7GXKaSIZVjyXJcOqx0u\nNoO0LeHywgD1eooPB4qWDllVqASzsd64awVz6y9DiXOIVE+xbZ6SAoBGM8hUeB48\n3igBMlPUxv6qhivpYB3pttuRET+RYCskwhQNqsLrPQKBgQD/3UHyA10GJhzwEmAx\ngOCbxesQ8WttyzpqZ9mv2iz9gnUid8+oQyoFdnSU0Y1MUqNEQIHbNB0dZ8z4tG8i\neCQTALFbjNpei9SpahJvQkQjZy90zlOENZMKqT3j3FSKFIT02ZQvAIAl8uZJTlb5\nSEhBQtW6azBYyGsspZePss48/wKBgQC4PQOeLizACtjK7p/rNdXmNwvRvO0eiKCt\n0hGOnMnFYrz+p2JnRJPxiSupqzm57fVk8lZEYdYgUysrFraj4tUi7befSxyzw1IV\nZslW9FVWrYGOgXezHSmvRmGiyTtBMkciycjNMtzTGpToni3meJNjM+ouhhA/Os8B\nLLn7uC1FbQKBgQC1Na+xxl4Ir8+I24rTJJJu4JJl8oWCQg/CMoDDAcMhXFa3LaGd\naswFCGryxyLKbjCBcypE5DjGjbBmZ+vZvrrV1oTF8RDrKx9XSO97arQ1WqwKjuIp\nXYQhZdGWYoJhNL0haEOBsloQBmLAgkIo1N+PkNUr7SRVjMQS38hilmFoYwKBgQCW\nWhyYuyAD/RYczg4t2npb7LI1kNOFpoRSNevkEWnMLp8Dxr/UfK+rXoEGbtimNl6b\n6fSiy6D+MkE5YcjdB+FeJtdCJP8gaJaVJpPK5Yy7Ns9S568yuerpwistuMElnI1X\nA4teglKZ6Mh66ZOV0PKe85/6JageobSLRd/lX9F6JQKBgQC8gOhdQMjTeIBB58xs\nddk431HERn6gttuKes/F+tQVKnJUpCi6/9fbOkOKOWlifv8pEY5d0opzPDGiSX4t\nwWxzdkapyYus6awbv9mQr7LSOxAa/VBXA/QhkRdqU+QZ07lUtprOn4vnhjjm3TQg\ntOgMNr5ffOzDn7kasE7vRwCR4A==\n-----END PRIVATE KEY-----\n",
  client_email:
    "firebase-adminsdk-v3phd@taskwisecollaborativeai.iam.gserviceaccount.com",
  client_id: "102784005926339450100",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-v3phd%40taskwisecollaborativeai.iam.gserviceaccount.com",
} as ServiceAccount;

// Initialize the app
initializeApp({
  credential: cert(serviceAccount),
});

// Get messaging instance
const messaging = getMessaging();

// Function to send push notification
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
    };

    const response = await messaging.send(message);
    console.log("Successfully sent notification:", response);
    return response;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
