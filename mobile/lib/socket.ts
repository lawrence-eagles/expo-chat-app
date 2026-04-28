import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { QueryClient } from "@tanstack/react-query";
import { Chat, Message, MessageSender } from "@/types";
import * as Sentry from "@sentry/react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://192.168.0.103:9000";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // chatId -> userId
  unreadChats: Set<string>;
  currentChatId: string | null;
  queryClient: QueryClient | null;

  connect: (token: string, queryClient: QueryClient) => void;
  disconnect: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (
    chatId: string,
    text: string,
    currentUser: MessageSender,
  ) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  unreadChats: new Set(),
  currentChatId: null,
  queryClient: null,
  connect: (token, queryClient) => {
    // Get the current socket
    const existingSocket = get().socket; // Checks if we already have a socket connection saved.

    //  if true => We already have an active connection → return
    // This prevents Opening multiple sockets, Wasting resources, and Duplicate event listeners
    if (existingSocket?.connected) return; // checks if the socket exists AND is already connected

    // If a socket exists but is NOT connected: It disconnects it before creating a new one
    // This avoids “ghost” connections, prevents memory leaks, ensures only one socket instance exists
    if (existingSocket) existingSocket.disconnect(); // Clean up old socket

    // creates a Socket.IO client connection and sends token during connection
    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on("connect", () => {
      console.log("Socket connected, id:", socket.id);
      Sentry.logger.info("Socket connected", { socketId: socket.id });
      set({ isConnected: true });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected", socket.id);
      Sentry.logger.info("Socket disconnected", { socketId: socket.id });
      set({ isConnected: false });
    });

    socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
      console.log("Received online-users:", userIds);
      set({ onlineUsers: new Set(userIds) });
    });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      set((state) => ({
        onlineUsers: new Set([...state.onlineUsers, userId]),
      }));
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      set((state) => {
        const onlineUsers = new Set(state.onlineUsers);
        onlineUsers.delete(userId);
        return { onlineUsers };
      });
    });

    socket.on("socket-error", (error: { message: string }) => {
      console.log("Socket error:", error.message);
      Sentry.logger.error("Socket error occurred", {
        message: error.message,
      });
    });

    socket.on("new-message", (message: Message) => {
      const senderId = (message.sender as MessageSender)._id;
      const { currentChatId } = get();

      // add message to the chat's message list, replacing optimistic messages
      queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
        // If no messages exist yet: create a new list with this message
        if (!old) return [message];

        // remove any optimistic message (temp IDs) and add the real one
        const filtered = old.filter((m) => !m._id.startsWith("temp-")); // remove all fake (optimistic) messages

        // Prevent duplicates
        // check if we already have message then:
        // do nothing
        // return current list
        // Prevents duplicate UI entries because socket can resend events or duplicate messages
        if (filtered.some((m) => m._id === message._id)) return filtered;
        return [...filtered, message]; // add real message. If message is new append it to the list
      });

      // Update chat's lastMessage directly for instant UI update
      queryClient.setQueryData<Chat[]>(["chats"], (oldChats) => {
        return oldChats?.map((chat) => {
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

          return chat;
        });
      });

      // mark as unread if not currently viewing this chat and message is from other user
      if (currentChatId !== message.chat) {
        // Reads data from React Query cache
        const chats = queryClient.getQueryData<Chat[]>(["chats"]);
        const chat = chats?.find((c) => c._id === message.chat);

        // Check if message is from the OTHER user
        // If you send a message it comes back via websocket without this check you will mark your own message as unread.
        if (chat?.participant && senderId === chat.participant._id) {
          set((state) => ({
            unreadChats: new Set([...state.unreadChats, message.chat]),
          }));

          // to avoid array conversion a more efficient way is to do
          // const newSet = new Set(state.unreadChats);
          // newSet.add(message.chat);
          // return { unreadChats: newSet };
        }
      }

      // clear typing indicator when message received
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });
    });

    socket.on(
      "typing",
      ({
        userId,
        chatId,
        isTyping,
      }: {
        userId: string;
        chatId: string;
        isTyping: boolean;
      }) => {
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          if (isTyping) typingUsers.set(chatId, userId);
          else typingUsers.delete(chatId);

          return { typingUsers };
        });
      },
    );

    set({ socket, queryClient });
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        onlineUsers: new Set(),
        typingUsers: new Map(),
        unreadChats: new Set(),
        currentChatId: null,
        queryClient: null,
      });
    }
  },
  joinChat: (chatId) => {
    const socket = get().socket;
    set((state) => {
      // This line is VERY important.
      // calling state.unreadChats.delete(chatId); directly mutates the original state
      // Zustand (like React) expects immutable updates
      // By doing this Zustand detects a new reference and React component re-render properly
      // if you mutate directly UI may not update
      const unreadChats = new Set(state.unreadChats);

      // Removes chat with chatId from unreadChats
      // meaning the chat is now opened so it is no longer unread.
      unreadChats.delete(chatId);

      // track which chat is currently opened -> currentChatId
      // and update unreadChats removing the currently opened chat.
      return { currentChatId: chatId, unreadChats };
    });

    // not ? is important to prevent the app from crashing if socket is undefined
    // the if statement makes sure code only runs if socket exists and is connected
    if (socket?.connected) {
      socket.emit("join-chat", chatId);
    }
  },
  leaveChat: (chatId) => {
    const { socket } = get();
    set({ currentChatId: null });
    if (socket?.connected) {
      socket.emit("leave-chat", chatId);
    }
  },
  sendMessage: (chatId, text, currentUser) => {
    const { socket, queryClient } = get();

    // Guard clause (very important)
    // This prevents sending messages when socket is not connected and updating cache when query client is missing
    if (!socket?.connected || !queryClient) return;

    // optimistic updates Create a temporary message (optimistic UI)
    const tempId = `temp-${uuidv4()}`; // create a fake message ID

    // Creates a temporary message for optimistic udpate. This message mimics a real message from the server
    const optimisticMessage: Message = {
      _id: tempId,
      chat: chatId,
      sender: currentUser,
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update (instant UI update)
    // add optimistic message immediately
    // Updates React Query cache for: ["messages", chatId]
    // The message appears instantly in the UI no waiting for server
    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
      if (!old) return [optimisticMessage]; // If no messages exist → create new array
      return [...old, optimisticMessage]; // Else → append new message
    });

    // Send message to server
    socket.emit("send-message", { chatId, text });

    // Logs success using Sentry
    Sentry.logger.info("Message send successfully", {
      chatId,
      messageLength: text.length,
    });

    // Define errorHandler -> This runs if the server emits "socket-error"
    const errorHandler = (error: { message: string }) => {
      // Log error usng Sentry
      Sentry.logger.error("Failed to send message", {
        chatId,
        error: error.message,
      });

      // Rollback optimistic update
      // Removes the fake message
      queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
        if (!old) return [];
        return old.filter((m) => m._id !== tempId);
      });

      // Remove event listener
      // This prevents duplicate handlers and memory leaks
      socket.off("socket-error", errorHandler);
    };

    // Listen for error once
    // Run handler only once and automatically remove after
    socket.once("socket-error", errorHandler);
  },
  sendTyping: (chatId, isTyping) => {
    const { socket } = get();

    if (socket?.connected) {
      socket.emit("typing", { chatId, isTyping });
    }
  },
}));
