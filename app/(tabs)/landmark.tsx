import CameraFeed from "@/components/Camerafeed";
import { Landmark } from "@/components/LandmarkDetector/strategies/Strategy";
import LandmarkReplayer from "@/components/LandmarkReplayer";
import { useAuth } from "@/contexts/AuthContext";
import React, { useState } from "react";

export default function LandmarkScreen() {
  const { user } = useAuth();
  const [landmarkRes, setLandmarkRes] = useState<{
    landmarkData: {
      timeFromStart: number; // in seconds
      landmarks: Landmark[]; // Array of landmarks for this frame
    }[];
    recordedVideoUri: string;
  }>();
  const [showReplayer, setShowReplayer] = useState(false);

  // if (!user) {
  //   return <AuthScreen />;
  // }

  const handleLandmarksDetected = (
    landmarks: {
      timeFromStart: number; // in seconds
      landmarks: Landmark[];
    }[],
    recordedVideoUri: string
  ) => {
    setLandmarkRes({ landmarkData: landmarks, recordedVideoUri });
    setShowReplayer(true);
  };

  const handleReset = () => {
    setShowReplayer(false);
    setLandmarkRes(undefined);
  };

  return (
    <>
      {showReplayer && landmarkRes ? (
        <LandmarkReplayer
          videoUri={landmarkRes?.recordedVideoUri}
          landmarkInfo={landmarkRes?.landmarkData || []}
        />
      ) : (
        <CameraFeed onLandmarksDetected={handleLandmarksDetected} />
      )}
    </>
  );
}
