import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { clerkClient, getAuth } from "@clerk/express";

export async function getMe(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// This function  replaces inngest and saves user info to db if user is not in db already.
export async function authCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      // get user info from clerk and save to db
      const clerkUser = await clerkClient.users.getUser(clerkId);

      user = await User.create({
        clerkId,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar: clerkUser.imageUrl,
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
