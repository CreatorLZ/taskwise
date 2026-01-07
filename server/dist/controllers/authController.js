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
exports.logout = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
// Register a new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const user = new User_1.default({ username, email, password });
        yield user.save();
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.status(201).json({ token });
    }
    catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
});
exports.register = register;
// Log in a user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user || !(yield user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        user.isLoggedIn = true;
        yield user.save();
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.json({ token, userId: user._id.toString(), user });
    }
    catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
});
exports.login = login;
//logout a user
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.body.userId;
        // Update the user's record
        yield User_1.default.findByIdAndUpdate(userId, {
            fcmToken: null,
            isLoggedIn: false,
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error logging out", error });
    }
});
exports.logout = logout;
