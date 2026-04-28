import { useAuth, UserButton, useUser } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { SparklesIcon, MessageSquareIcon, PlusIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useChats, useGetOrCreateChat } from "../hooks/useChats";
import { useMessages } from "../hooks/useMessages";
import NoConversationsUI from "../components/NoConversationsUI";
import ChatListItem from "../components/ChatListItem";
import { ChatHeader } from "../components/ChatHeader";
import NoMessagesUI from "../components/NoMessagesUI";
import MessageBubble from "../components/MessageBubble";
import { useCurrentUser } from "../hooks/useCurrentUser";
import ChatInput from "../components/ChatInput";
import NoChatSelectedUI from "../components/NoChatSelectedUI";
import NewChatModal from "../components/NewChatModal";

const ChatPage = () => {
  const { signOut } = useAuth();
  const { data: currentUser } = useCurrentUser();
  // useSearchParams gets the query params from the url
  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get("chat");
  const [messageInput, setMessageInput] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, setTyping, sendMessage } = useSocketStore();

  useSocketConnection(activeChatId);

  const { data: chats = [], isLoading: chatsLoading } = useChats();
  const { data: messages = [], isLoading: messagesLoading } =
    useMessages(activeChatId);
  const startChatMuatation = useGetOrCreateChat();

  // scroll to bottom when chat or messages changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatId, messages]);

  const handleStartChat = (participantId) => {
    startChatMuatation.mutate(participantId, {
      onSuccess: (chat) => setSearchParams({ chat: chat._id }),
    });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId || !currentUser) return;

    const text = messageInput.trim();
    sendMessage(activeChatId, text, currentUser);
    setMessageInput("");
    setTyping(activeChatId, false);
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!activeChatId) return;

    setTyping(activeChatId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeChatId, false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const activeChat = chats.find((c) => c._id === activeChatId);

  return (
    <div className="h-screen bg-gray-800 text-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Link to={"/chat"} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-primary-content" />
              </div>
              <span className="font-bold">Expo Chat</span>
            </Link>
            <UserButton />
          </div>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="btn btn-primary btn-block gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border-none"
          >
            <PlusIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* chat list */}
        <div className="flex-1 overflow-y-auto">
          {chatsLoading && (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-sm text-amber-400" />
            </div>
          )}

          {!chatsLoading && chats.length === 0 && <NoConversationsUI />}

          <div className="flex flex-col gap-1">
            {chats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isActive={activeChatId === chat._id}
                handleClick={() => setSearchParams({ chat: chat._id })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeChatId && activeChat ? (
          <>
            <ChatHeader
              participant={activeChat.participant}
              chatId={activeChatId}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading && (
                <div className="flex items-center justify-center h-full">
                  <span className="loading loading-spinner loading-md text-amber-400" />
                </div>
              )}

              {messages.length === 0 && !messagesLoading && <NoMessagesUI />}

              {messages.length > 0 &&
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    currentUser={currentUser}
                  />
                ))}
              {/* Makes sure view scrolls to bottom every time */}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              value={messageInput}
              onChange={handleTyping}
              onSubmit={handleSend}
              disabled={!messageInput.trim()}
            />
          </>
        ) : (
          <NoChatSelectedUI />
        )}
      </div>

      <NewChatModal
        onStartChat={handleStartChat}
        isPending={startChatMuatation.isPending}
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />
    </div>
  );
};

export default ChatPage;
