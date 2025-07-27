import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TopNavbar = () => {
  const [isFriendMenuVisible, setIsFriendMenuVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current; // Animation state

  const toggleFriendMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: isFriendMenuVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsFriendMenuVisible(!isFriendMenuVisible);
  };

  const slideInterpolation = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <View className="flex-row justify-between items-center px-6 py-2 ">
      <TouchableOpacity
        className=" border border-black px-2 py-1 rounded-2xl"
        onPress={() => {
          /* Handle Settings */
        }}
      >
        <Ionicons name="menu" size={32} />
      </TouchableOpacity>

      {/* expandable friend menu view */}
      <Animated.View
        style={[{ transform: [{ translateX: slideInterpolation }] }]}
        className="absolute right-0 top-14 bg-black w-56 h-screen z-50 justify-center items-center rounded-2xl"
      >
        <Text className="text-white">Hi!</Text>
      </Animated.View>
      <TouchableOpacity
        onPress={toggleFriendMenu}
        className="border border-black px-2 py-1 rounded-2xl"
      >
        <Ionicons name="people" size={32} />
      </TouchableOpacity>
    </View>
  );
};

export default TopNavbar;
