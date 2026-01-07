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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    username: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    taskAnalysisSchedule: {
        firstRunTime: { type: String, default: "" },
        secondRunTime: { type: String, default: "" },
        enabled: { type: Boolean, default: false },
    },
    password: { type: String, required: false },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    fcmToken: { type: String },
    tasks: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Task" }], // Reference to Task collection
    googleId: { type: String },
    avatar: { type: String },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
}, { timestamps: true });
// Hash password before saving
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        const salt = yield bcryptjs_1.default.genSalt(10); // salt rounds for security
        this.password = yield bcryptjs_1.default.hash(this.password, salt);
        next();
    });
});
// Method to compare password
UserSchema.methods.comparePassword = function (plainPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        // If no password (Google user), return false
        if (!this.password)
            return false;
        return yield bcryptjs_1.default.compare(plainPassword, this.password);
    });
};
// Index email for faster querying
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });
exports.default = mongoose_1.default.model("User", UserSchema);
