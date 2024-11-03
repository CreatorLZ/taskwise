import { Router } from "express";
import { login, register } from "../controllers/authController";

const router = Router();

// routes linked to controller methods
router.post("/login", login); // Login endpoint
router.post("/register", register); // Register endpoint

export default router;
