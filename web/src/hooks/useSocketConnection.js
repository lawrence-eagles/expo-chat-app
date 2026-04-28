import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../lib/socket";
import { useEffect } from "react";

export const useSocketConnection = (activeChatId) => {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { socket, connect, disconnect, joinChat, leaveChat } = useSocketStore();

  // connect socket on mount

  useEffect(() => {
    if (isSignedIn) {
      getToken().then((token) => {
        if (token) connect(token, queryClient);
      });
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isSignedIn, connect, disconnect, getToken, queryClient]);

  useEffect(() => {
    // checks if there active chat ID and if socket is connected.
    // the active chat ID is checked from the url if present this would run immediately and join that chat
    if (activeChatId && socket) {
      joinChat(activeChatId);
      return () => leaveChat(activeChatId);
    }
  }, [activeChatId, socket, joinChat, leaveChat]);
};
