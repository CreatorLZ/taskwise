import { config } from "dotenv";
import jwt from "jsonwebtoken";

config();

const JWT_SECRET: string = process.env.JWT_SECRET as string;

// Generate a JWT
export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

// Verify a JWT
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
