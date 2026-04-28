import { Send } from "lucide-react";

function ChatInput({ value, onChange, onSubmit, disabled }) {
  return (
    <form onSubmit={onSubmit} className="p-4 border-t border-gray-800">
      <div className="flex items-center gap-3">
        <input
          type="text"
          aria-label="Message"
          value={value}
          onChange={onChange}
          placeholder="Type a message..."
          className="input input-bordered flex-1 rounded-xl bg-base-300/40 border-gray-800 placeholder:text-base-content/60"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={disabled}
          className="btn rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-none disabled:btn-disabled"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

export default ChatInput;
