"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.googleLogin = void 0;
const google_auth_library_1 = require("google-auth-library");
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Handle Google login
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { googleUser } = req.body;
        if (!googleUser || !googleUser.sub || !googleUser.email) {
            return res.status(400).json({ message: "Invalid Google user data" });
        }
        const { email, name, picture, sub } = googleUser;
        // Check if user exists
        let user = yield User_1.default.findOne({ $or: [{ googleId: sub }, { email }] });
        if (user) {
            // User exists, update Google ID if needed
            if (!user.googleId) {
                user.googleId = sub;
                user.authProvider = "google";
                if (picture && !user.avatar) {
                    user.avatar = picture;
                }
                yield user.save();
            }
        }
        else {
            // Create new user
            user = new User_1.default({
                username: name,
                email,
                googleId: sub,
                avatar: picture,
                authProvider: "google",
            });
            yield user.save();
        }
        // Set user as logged in
        user.isLoggedIn = true;
        yield user.save();
        // Generate JWT token
        const authToken = (0, jwt_1.generateToken)(user._id.toString());
        // Return user data and token
        res.json({
            token: authToken,
            userId: user._id.toString(),
            user: {
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                taskAnalysisSchedule: user.taskAnalysisSchedule,
                authProvider: user.authProvider,
            },
        });
    }
    catch (error) {
        console.error("Google authentication error:", error);
        res
            .status(500)
            .json({ message: "Error authenticating with Google", error });
    }
});
exports.googleLogin = googleLogin;
// Handle Google callback (for server-side)
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // This endpoint is for server-side OAuth flow
    // For client-side flow with Firebase/Google SDK, this might not be needed
    res.status(200).json({ message: "Google authentication successful" });
});
exports.googleCallback = googleCallback;
