import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yourSecretKey";

// Generate a JWT
export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
};

// Verify a JWT
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
