import { MessageSquareIcon } from "lucide-react";

function NoConversationsUI() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <MessageSquareIcon className="w-10 h-10 text-amber-400 mb-3" />
      <p className="text-white/70 text-sm">No conversations yet</p>
      <p className="text-white/60 text-xs mt-1">Start a new chat to begin</p>
    </div>
  );
}

export default NoConversationsUI;
