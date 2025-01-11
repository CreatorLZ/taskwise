import { config } from "dotenv";
import jwt from "jsonwebtoken";

config();

const JWT_SECRET: string = process.env.JWT_SECRET as string;
const JWT_EXPIRATION: string = process.env.JWT_EXPIRATION as string;

// Generate a JWT
export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Verify a JWT
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
