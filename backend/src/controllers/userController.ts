import { Types } from "mongoose";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

export async function getUsers(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const users = await User.find({
      _id: { $ne: new Types.ObjectId(userId as string) },
    })
      .select("name email avatar")
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
