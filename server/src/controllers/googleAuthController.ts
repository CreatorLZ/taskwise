import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import { generateToken } from "../utils/jwt";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Handle Google login
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  try {
    const { googleUser } = req.body;

    if (!googleUser || !googleUser.sub || !googleUser.email) {
      return res.status(400).json({ message: "Invalid Google user data" });
    }

    const { email, name, picture, sub } = googleUser;

    // Check if user exists
    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

    if (user) {
      // User exists, update Google ID if needed
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = "google";
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        username: name,
        email,
        googleId: sub,
        avatar: picture,
        authProvider: "google",
      });
      await user.save();
    }

    // Set user as logged in
    user.isLoggedIn = true;
    await user.save();

    // Generate JWT token
    const authToken = generateToken(user._id.toString());

    // Return user data and token
    res.json({
      token: authToken,
      userId: user._id.toString(),
      user: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        taskAnalysisSchedule: user.taskAnalysisSchedule,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    res
      .status(500)
      .json({ message: "Error authenticating with Google", error });
  }
};

// Handle Google callback (for server-side)
export const googleCallback = async (
  req: Request,
  res: Response
): Promise<void | any> => {
  // This endpoint is for server-side OAuth flow
  // For client-side flow with Firebase/Google SDK, this might not be needed
  res.status(200).json({ message: "Google authentication successful" });
};
