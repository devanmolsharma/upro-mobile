import { Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/contexts/AuthContext";
import AuthScreen from "@/components/AuthScreen";

type IconName = React.ComponentProps<typeof IconSymbol>["name"];

interface NavItem {
  name: string;
  title: string;
  icon: IconName;
}

const navigations: NavItem[] = [
  {
    name: "index",
    title: "Home",
    icon: "house.fill",
  },
  // {
  //   name: "explore",
  //   title: "Explore",
  //   icon: "paperplane.fill",
  // },
  {
    name: "training",
    title: "Training",
    icon: "figure.walk",
  },
  {
    name: "multiPlayer",
    title: "Multiplayer",
    icon: "person.3.fill",
  },
  {
    name: "lockerRoom",
    title: "Locker Room",
    icon: "lock.fill",
  },
  {
    name: "shop",
    title: "Shop",
    icon: "cart.fill",
  },
];

export default function TabLayout() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  if (!user) {
    return <AuthScreen />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      {navigations.map((nav) => (
        <Tabs.Screen
          key={nav.name}
          name={nav.name}
          options={{
            title: nav.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name={nav.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
