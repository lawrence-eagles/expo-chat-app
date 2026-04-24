import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMessages } from "@/hooks/useMessages";
import { useSocketStore } from "@/lib/socket";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import EmptyUI from "@/components/EmptyUI";
import { MessageSender } from "@/types";
import MessageBubble from "@/components/MessageBubble";

type ChatParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
};

const ChatDetailScreen = () => {
  const {
    id: chatId,
    participantId,
    name,
    avatar,
  } = useLocalSearchParams<ChatParams>();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data: currentUser } = useCurrentUser();
  const { data: messages, isLoading } = useMessages(chatId);

  const {
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    isConnected,
    onlineUsers,
    typingUsers,
  } = useSocketStore();

  const isOnline = participantId ? onlineUsers.has(participantId) : false;
  const isTyping = typingUsers.get(chatId) === participantId;

  // ReturnType<...> -> This is a TypeScript utility type that extracts what a function returns.
  // So ReturnType<typeof setTimeout> means “whatever setTimeout returns”
  // typeof setTimeout means the function signature of setTimeout
  // Depending on the environment: In browsers → setTimeout returns a number
  // In Node.js → it returns a Timeout object/ Using ReturnType<typeof setTimeout> makes your code: portable correct in both environments
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // join chat room on mount, leave on unmount
  useEffect(() => {
    if (chatId && isConnected) joinChat(chatId);
    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [chatId, isConnected, joinChat, leaveChat]);

  // scroll to bottom when new mesages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    }
  }, [messages]);

  // This function is a debounced typing handler—it updates the input state and controls when to notify the server that a user is typing or has stopped typing. It’s a classic pattern used in chat apps to avoid spamming “typing” events.

  // This memoizes the function so it doesn’t get recreated on every render unless one of the dependencies changes.
  const handleTyping = useCallback(
    (text: string) => {
      // update local state input
      // Updates the UI with the latest input value
      // Happens immediately on every keystroke
      setMessageText(text);

      // Guard Clause (Early Exit)
      // stop the execution if socket is not connected or if chat ID is missing
      if (!isConnected || !chatId) return;

      // checks if user is typing
      if (text.length > 0) {
        // notifies the server
        // This is called on every keystroke
        sendTyping(chatId, true);

        // clear existing timeout
        // If a previous timer exists → cancel it because:
        // user is still typing and we don’t want the “stop typing” event to fire yet
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // stop typing after 2 seconds of no input
        // Wait 2 seconds after the last keystroke then =>
        // notify the server the user has stopped typing.
        // Key Idea: Debouncing Every keystroke:
        // Cancels previous timer and starts a new 2-second timer so:
        // If user keeps typing → timer keeps resetting, If user pauses → timer completes → “stop typing” is sent
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(chatId, false);
        }, 2000);
      } else {
        // text cleared, stop typing
        // this happens when user deletes everything or when input field becomes empty
        if (typingTimeoutRef.current) {
          // Prevents any pending “stop typing” from firing later
          clearTimeout(typingTimeoutRef.current);
        }
        // If input is empty → user is definitely not typing notify server
        sendTyping(chatId, false);
      }
    },
    [chatId, isConnected, sendTyping],
  );

  const handleSend = () => {
    if (!messageText.trim() || isSending || !isConnected || !currentUser)
      return;

    // stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTyping(chatId, false);

    setIsSending(true);
    sendMessage(chatId, messageText.trim(), {
      _id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      avatar: currentUser.avatar,
    });

    setMessageText("");
    setIsSending(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-light">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={"#F4A261"} />
        </Pressable>

        <View className="flex-row items-center flex-1 ml-2">
          {avatar && (
            <Image
              source={avatar}
              style={{ width: 40, height: 40, borderRadius: 999 }}
            />
          )}
          <View className="ml-3">
            <Text
              className="text-foreground font-semibold text-base"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className={`text-xs ${isTyping ? "text-primary" : "text-muted-foreground"}`}
            >
              {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="size-9 rounded-full items-center justify-center">
            <Ionicons name="call-outline" size={20} color={"#A0A0A5"} />
          </Pressable>
          <Pressable className="size-9 rounded-full items-center justify-center">
            <Ionicons name="videocam-outline" size={20} color={"#A0A0A5"} />
          </Pressable>
        </View>
      </View>

      {/* Messages and keyboard input */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-surface">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size={"large"} color={"#F4A261"} />
            </View>
          ) : !messages || messages.length === 0 ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor="#6B6B70"
              iconSize={64}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 8,
              }}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }}
            >
              {messages.map((message) => {
                const senderId = (message.sender as MessageSender)._id;
                const isFromMe = currentUser
                  ? senderId === currentUser._id
                  : false;

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isFromMe={isFromMe}
                  />
                );
              })}
            </ScrollView>
          )}

          {/* Input bar */}
          <View className="px-3 pb-3 pt-2 bg-surface border-t border-surface-light">
            <View className="flex-row items-center bg-surface-card rounded-3xl px-3 py-1.5 gap-2">
              <Pressable className="size-8 rounded-full items-center justify-center">
                <Ionicons name="add" size={22} color={"#F4A261"} />
              </Pressable>

              {/* With multiline, the onscreen keyboard enter btn may not always trigger the handleSend function unless: blurOnSubmit is configured */}
              <TextInput
                placeholder="Type a message"
                placeholderTextColor={"#6B6B70"}
                className="flex-1 text-foreground text-sm mb-2"
                multiline
                style={{ maxHeight: 100 }}
                value={messageText}
                onChangeText={handleTyping}
                onSubmitEditing={handleSend}
                editable={!isSending}
              />

              <Pressable
                className="size-8 rounded-full items-center justify-center bg-primary"
                onPress={handleSend}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size={"small"} color={"#0D0D0F"} />
                ) : (
                  <Ionicons name="send" size={18} color={"#0D0D0F"} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;
