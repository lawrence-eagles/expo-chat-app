import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";

const ChatsTab = () => {
  return (
    <SafeAreaView className="bg-surface flex-1">
      <ScrollView>
        <Text className="text-white">Chats Tab</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatsTab;
