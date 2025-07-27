import AuthScreen from "@/components/AuthScreen";
import ProfileScreen from "@/components/ProfileScreen";
import { useAuth } from "@/contexts/AuthContext";

export default function TabTwoScreen() {
  const { user } = useAuth();

  if (!user) {
    return <AuthScreen />;
  }

  return <ProfileScreen />;
}
