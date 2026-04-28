import React from "react";
import { useSocketStore } from "../lib/socket";
import { formatTime } from "../lib/utils";

function ChatListItem({ chat, isActive, handleClick }) {
  const { onlineUsers, typingUsers } = useSocketStore();
  const isOnline = onlineUsers.has(chat.participant?._id);
  const isTyping = !!typingUsers.get(chat._id);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl w-full normal-case ${isActive ? "bg-white/10" : ""}`}
    >
      <div className="relative">
        <img
          src={chat.participant?.avatar}
          className="w-11 h-11 rounded-full bg-gray-700/40"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-gray-900" />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">
            {chat.participant?.name || "Unknown"}
          </span>
          {chat.lastMessageAt && (
            <span className="text-xs text-white/60">
              {formatTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-white/70 truncate mt-0.5">
          {isTyping ? "typing..." : chat.lastMessage?.text || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

export default ChatListItem;
