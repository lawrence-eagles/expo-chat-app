import { formatTime } from "../lib/utils";

function MessageBubble({ message, currentUser }) {
  // const isMe = message.sender?._id?.toString() === currentUser?._id?.toString();

  const senderId = message?.sender?._id ?? message?.sender;
  const currentUserId = currentUser?._id;
  const isMe =
    senderId != null &&
    currentUserId != null &&
    String(senderId) === String(currentUserId);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-md px-4 py-2.5 rounded-2xl ${isMe ? "bg-gradient-to-r from-amber-500 to-orange-500 text-gray-800" : "bg-gray-900/40 text-white"}`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 ${isMe ? "text-gray-800/80" : "text-white/70"}`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
