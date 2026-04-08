import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { Chat } from "../models/Chat.js";
import { Types } from "mongoose";

export async function getChats(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;

    const chats = await Chat.find({ participants: new Types.ObjectId(userId) })
      .populate("participants", "name email avatar")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== userId,
      );

      return {
        _id: chat._id,
        participant: otherParticipant ?? null,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
      };
    });

    res.json(formattedChats);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function getOrCreateChat(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const { participantsId } = req.params;

    if (!participantsId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (!Types.ObjectId.isValid(participantsId as string)) {
      return res.status(400).json({ message: "Invalid participant ID format" });
    }

    if (userId === participantsId) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    // check if chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [
          new Types.ObjectId(userId),
          new Types.ObjectId(participantsId as string),
        ],
      },
    })
      .populate("participants", "name email avatar")
      .populate("lastMessage");

    if (!chat) {
      const newChat = new Chat({
        participants: [
          new Types.ObjectId(userId),
          new Types.ObjectId(participantsId as string),
        ],
      });

      await newChat.save();

      chat = await newChat.populate("participants", "name email avatar");
    }

    const otherParticipant = chat.participants.find(
      (p: any) => p._id.toString() !== userId,
    );

    res.json({
      _id: chat._id,
      participant: otherParticipant ?? null,
      lastMessage: chat.lastMessage,
      createdAt: chat.createdAt,
    });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
