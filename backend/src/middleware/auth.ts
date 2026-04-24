import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";

export type AuthRequest = Request & {
  userId?: string;
};

export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId: clerkId, isAuthenticated } = getAuth(req);

    if (!clerkId || !isAuthenticated) {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(401).json({ message: "User not found" });

    req.userId = user._id.toString(); // toString() to convert ObjectId to string

    next();
  } catch (error) {
    res.status(500);
    next(error);
  }
};
