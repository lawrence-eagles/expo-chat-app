import { View, Text, ScrollView, Pressable } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";

const ProfileTab = () => {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="bg-surface flex-1">
      <ScrollView>
        <Text className="text-white">Profile Tab</Text>
        <Pressable onPress={() => signOut()} className="p-4 bg-red-500">
          <Text>SignOut</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileTab;
