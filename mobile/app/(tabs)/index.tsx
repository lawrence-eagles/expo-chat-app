import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { useRouter } from "expo-router";
import { useChats } from "@/hooks/useChats";
import Header from "@/components/Header";
import ChatItem from "@/components/ChatItem";
import EmptyUI from "@/components/EmptyUI";
import { Chat } from "@/types";

const ChatsTab = () => {
  const router = useRouter();
  const { data: chats, isLoading, error, refetch } = useChats();

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size={"large"} color={"#F4A261"} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-red-500 text-3xl">Failed to load chats</Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary rounded-lg"
        >
          <Text className="text-foreground">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const handleChatPress = (chat: Chat) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: chat._id,
        participantId: chat.participant._id,
        name: chat.participant.name,
        avatar: chat.participant.avatar,
      },
    });
  };

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ChatItem chat={item} onPress={() => handleChatPress(item)} />
          )}
          showsVerticalScrollIndicator={false}
          // contentInsetAdjustmentBehavior="automatic" // this works on ios only that is why I am using the SafeAreaView from react-native-safe-area-context
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          ListHeaderComponent={<Header />}
          ListEmptyComponent={
            <EmptyUI
              title="No chats yet"
              subtitle="Start a conversation"
              iconName="chatbubbles-outline"
              iconColor="#686870"
              iconSize={64}
              buttonLabel="New Chat"
              onPressButton={() => router.push("/new-chat")}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
};

export default ChatsTab;
