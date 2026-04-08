import mongoose, { Types } from "mongoose";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";

export async function getMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const { chatId } = req.params;

    if (!Types.ObjectId.isValid(chatId as string)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    const chat = await Chat.findOne({
      _id: new Types.ObjectId(chatId as string),
      participants: new Types.ObjectId(userId),
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messages = await Message.find({
      chat: new Types.ObjectId(chatId as string),
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: 1 }); // displays oldest chat first.

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
