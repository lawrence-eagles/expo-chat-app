import { MessageSquareIcon } from "lucide-react";
import React from "react";

function NoChatSelectedUI() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
        <MessageSquareIcon className="w-10 h-10 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Welcome to Expo Chat</h2>
      <p className="text-white/70 max-w-sm">
        Select a conversation from the sidebar or start a new chat to begin
        messaging
      </p>
    </div>
  );
}

export default NoChatSelectedUI;
