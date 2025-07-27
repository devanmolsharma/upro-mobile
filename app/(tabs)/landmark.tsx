import CameraFeed from "@/components/Camerafeed";
import { useAuth } from "@/contexts/AuthContext";

export default function LandmarkScreen() {
  const { user } = useAuth();

  // if (!user) {
  //   return <AuthScreen />;
  // }

  return <CameraFeed />;
}
