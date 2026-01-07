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
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const nlpUtils_1 = require("../utils/nlpUtils");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post("/create-from-nlp", authMiddleware_1.authenticateUser, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ message: "No command provided" });
    }
    // Add prefix to the command
    const prefixedCommand = `create a task to ${command}`;
    // Extract user ID
    const userId = req.user.id;
    // Call the utility function and pass userId and command
    const createdTask = yield (0, nlpUtils_1.createTaskFromNLP)(prefixedCommand, userId);
    return res.status(201).json(createdTask);
})));
exports.default = router;
