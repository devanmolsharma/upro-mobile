import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Text, View } from "react-native";

export default function FriendList({ user }: { user: User }) {
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg">No user data available</Text>
      </View>
    );
  }

  const friends = supabase.from("friends");

  return (
    <View className="flex-1 justify-center items-center w-1/2 min-w-[200px] max-w-[500px]">
      <Text className="text-lg">Friend List Component</Text>
    </View>
  );
}
