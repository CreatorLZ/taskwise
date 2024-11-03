import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void | any => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
