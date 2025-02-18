import { Router } from "express";
import { login, logout, register } from "../controllers/authController";

const router = Router();

// routes linked to controller methods
router.post("/login", login); // Login endpoint
router.post("/register", register); // Register endpoint
router.post("/logout", logout); // Logout endpoint

export default router;
