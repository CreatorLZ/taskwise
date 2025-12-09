import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import User from "../models/User";
import { JwtPayload } from "jsonwebtoken";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | any> => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Received token:", token ? "present" : "missing");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = verifyToken(token) as JwtPayload;
    console.log("Decoded token payload:", {
      id: decoded.id,
      iat: decoded.iat,
      exp: decoded.exp,
    });
    const userId = decoded.id as string;
    const user = await User.findById(userId);
    console.log(
      "User lookup result:",
      user ? { id: user._id, email: user.email } : "User not found",
      "userId:",
      userId
    );
    if (!user) {
      console.log("User not found, rejecting auth");
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user details to the request object
    (req as any).user = {
      id: userId,
      email: user?.email,
      name: user?.username,
    };
    console.log("Auth successful for user:", userId);
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("Token verification error:", message);
    res.status(401).json({ message: "Token is not valid" });
  }
};
