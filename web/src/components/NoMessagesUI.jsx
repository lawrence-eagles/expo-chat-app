import { MessageSquareIcon } from "lucide-react";
import React from "react";

function NoMessagesUI() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/40 flex items-center justify-center mb-4">
        <MessageSquareIcon className="w-8 h-8 text-white/20" />
      </div>
      <p className="text-white/70">No messages yet</p>
      <p className="text-white/60 text-sm mt-1">
        Send a message to start the conversation
      </p>
    </div>
  );
}

export default NoMessagesUI;
