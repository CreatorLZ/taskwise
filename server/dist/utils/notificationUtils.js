"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};
// Initialize the app
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
// Get messaging instance
const messaging = admin.messaging();
// Function to send push notification
const sendPushNotification = (fcmToken, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
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
                    tag: (data === null || data === void 0 ? void 0 : data.taskId) || "task-reminder",
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
            data: Object.assign(Object.assign({}, data), { url: "/dashboard", taskId: (data === null || data === void 0 ? void 0 : data.taskId) || "", clickAction: "OPEN_DASHBOARD" }),
        };
        const response = yield messaging.send(message);
        console.log("Successfully sent notification:", response);
        return response;
    }
    catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
});
exports.sendPushNotification = sendPushNotification;
