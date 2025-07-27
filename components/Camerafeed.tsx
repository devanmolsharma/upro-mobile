import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View
} from "react-native";
import { LandmarkDetector } from "./LandmarkDetector/loader";
import { Landmark } from "./LandmarkDetector/strategies/Strategy";
// If you use react-native-video-processing, import it:
// import { ProcessingManager } from 'react-native-video-processing';

export default function CameraFeed() {
  const [permission, requestPermission] = useCameraPermissions();
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarkObjectsRef = useRef<Landmark[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const landmarkDetector = useRef<LandmarkDetector | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Load the ML model once
  useEffect(() => {
    landmarkDetector.current = new LandmarkDetector();
    landmarkDetector.current.loadModel().catch((error) => {
      console.error("Error loading model:", error);
    });
  }, []);

  // Log isRecording state changes
  useEffect(() => {
    console.log('isRecording changed:', isRecording);
  }, [isRecording]);

  // Function to capture frames for 30 seconds at 2 fps
  const handleCaptureFrames = async () => {
    if (!cameraRef.current || !cameraReady) return;
    setIsRecording(true);
    const frames: any[] = [];
    let elapsed = 0;
    const intervalMs = 500;
    const durationMs = 30000;
    const maxFrames = Math.floor(durationMs / intervalMs);

    const intervalId = setInterval(async () => {
      if (!cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, skipProcessing: true });
        frames.push(photo);
        console.log(`Captured frame ${frames.length}`);
      } catch (err) {
        console.error("Error capturing frame:", err);
      }
      elapsed += intervalMs;
      if (frames.length >= maxFrames) {
        clearInterval(intervalId);
        setIsRecording(false);
        await processFrames(frames);
      }
    }, intervalMs);
  };

  // Function to process frames
  async function processFrames(frames: any[]) {
    if (!landmarkDetector.current) {
      console.error("LandmarkDetector not loaded");
      return;
    }
    for (let i = 0; i < frames.length; i++) {
      const photo = frames[i];
      try {
        const landmarks = await landmarkDetector.current.detectLandmarks(photo.base64, photo.uri);
        console.log(`Frame ${i + 1}:`, landmarks);
      } catch (err) {
        console.error(`Error processing frame ${i + 1}:`, err);
      }
    }
    console.log("Finished processing all frames.");
  }

  // Permissions flow
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="front"
        ref={cameraRef}
        onCameraReady={() => setCameraReady(true)}
      />
      <View style={styles.controlBar}>
        <Button
          title={isRecording ? "Capturing..." : "Capture Frames (30s)"}
          onPress={handleCaptureFrames}
          disabled={isRecording}
        />
      </View>
      {/* Status Overlay and Visualization Panel can be updated to show video/landmark results */}
      {/* ...existing code for overlays and visualization... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  statusBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 8,
  },
  landmarkCount: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  visualizationPanel: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 320,
    height: 320,
    backgroundColor: "rgba(30,30,30,0.7)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(100,100,100,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  panelTitle: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    zIndex: 10,
  },
  glView: {
    flex: 1,
  },
  controlBar: {
    position: "absolute",
    bottom: 90, // Moved higher above the tab bar
    left: 20,
    right: 20,
    backgroundColor: "rgba(30,30,30,0.7)",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});
