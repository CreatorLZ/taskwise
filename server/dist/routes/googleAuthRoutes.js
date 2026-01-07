"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const googleAuthController_1 = require("../controllers/googleAuthController");
const router = (0, express_1.Router)();
// Google authentication routes
router.post("/googlelogin", googleAuthController_1.googleLogin);
router.post("/google/callback", googleAuthController_1.googleCallback);
exports.default = router;
