import { create } from "zustand";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL) throw error("SOCKET_URl not set!");

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  typingUsers: new Map(), // chatId => userId
  queryClient: null,

  connect: (token, queryClient) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected || !queryClient) return;

    // disconnect existing socket if any
    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socket.on("socket-error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("online-users", ({ userIds }) => {
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers };
      });
    });

    socket.on("typing", ({ userId, chatId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (isTyping) typingUsers.set(chatId, userId);
        else typingUsers.delete(chatId);
        return { typingUsers };
      });
    });

    socket.on("new-message", (message) => {
      const senderId = message.sender?._id;

      // Update the stored (cached) messages for this chat.
      // ["messages", message.chat] = cache key It identifies which chat’s messages to update.
      queryClient.setQueryData(["messages", message.chat], (old) => {
        // old = the current list of messages already in the cache
        // Without this line then if the old is empty due to:
        // cache expired or was cleared, first time opening chat so messages have not been fetched or cache is empty, query have not run yet or is loading
        // Then when old is undefined, the app would break:
        if (!old) return [message]; // If there are no existing messages, just start a list with this message.”
        // remove any optimistic (temp IDs) and add the real one
        // Remove temporary (optimistic) messages
        const filtered = old.filter((m) => !m._id.startsWith("temp-"));

        // checks if new message from server is already in the list.
        // Now the list only contains real messages from server after temp optimistic messages are removed
        // This is important to avoid dupicates
        const exists = filtered.some((m) => m._id === message._id);
        return exists ? filtered : [...filtered, message];
      });

      // update chat's last message directly for instant UI update
      queryClient.setQueryData(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
          // checks if this is the chat where the new message belongs?
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: {
                _id: message._id,
                text: message.text,
                sender: senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            };
          }

          return chat; // return other chats without updating them.
        });
      });

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        queryClient: null,
      });
    }
  },

  joinChat: (chatId) => {
    get().socket?.emit("join-chat", chatId);
  },
  leaveChat: (chatId) => {
    get().socket?.emit("leave-chat", chatId);
  },
  sendMessage: (chatId, text, currentUser) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) return;

    // create optimistic message
    const tempId = `temp-${uuidv4()}`;
    const optimisticMessage = {
      _id: tempId,
      chat: chatId,
      sender: {
        _id: currentUser._id,
        name: currentUser.fullName || currentUser.firstName || "You",
        email: currentUser.primaryEmailAddress?.emailAddress || "",
        avatar: currentUser.imageUrl,
      },
      text,
      created: new Date().toISOString(),
    };

    // add optimistic message to UI immediately
    queryClient.setQueryData(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage];
      return [...old, optimisticMessage];
    });

    // emit to server
    // send message to server so that it can be saved in the database
    socket.emit("send-message", { chatId, text });

    // handle errors - remove optimistic message from UI if send fails
    socket.once("socket-error", () => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });
    });
  },
  setTyping: (chatId, isTyping) => {
    get().socket?.emit("typing", { chatId, isTyping });
  },
}));
