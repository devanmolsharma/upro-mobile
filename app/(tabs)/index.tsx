import AuthScreen from "@/components/AuthScreen";
import TopNavbar from "@/components/TopNavBar";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function HomeScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <TopNavbar />
      <View className="flex-1 items-center px-6">
        <View className=" flex items-center justify-center w-[80%] h-[60%] mt-20">
          <View className="flex-row justify-between items-center w-full mb-4">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="currency-usd"
                size={24}
                color="black"
              />
              <Text className="text-lg font-semibold italic">Balance</Text>
            </View>
            <TouchableOpacity className="flex-row items-center gap-1">
              <FontAwesome5 name="user-friends" size={20} color="black" />
              <Text className="text-lg font-semibold italic">COUNT</Text>
            </TouchableOpacity>
          </View>
          <View className="w-full flex-1 flex items-center justify-center bg-white rounded-lg shadow-lg">
            <Text>Div for avatar section.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
