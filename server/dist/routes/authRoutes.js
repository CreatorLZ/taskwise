"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// routes linked to controller methods
router.post("/login", authController_1.login); // Login endpoint
router.post("/register", authController_1.register); // Register endpoint
router.post("/logout", authController_1.logout); // Logout endpoint
exports.default = router;
