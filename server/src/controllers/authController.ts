import { Request, Response } from "express";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import mongoose, { Schema, Document, Types } from "mongoose";
// Register a new user
export const register = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = generateToken(user._id.toString());
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

// Log in a user
export const login = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id.toString());
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};
