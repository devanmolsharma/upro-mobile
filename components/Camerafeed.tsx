import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LandmarkDetector } from "./LandmarkDetector/loader";
import { Landmark } from "./LandmarkDetector/strategies/Strategy";

export default function CameraFeed({
  onLandmarksDetected,
}: {
  onLandmarksDetected?: (
    landmarkInfo: { timeFromStart: number; landmarks: Landmark[] }[],
    recordedVideoUri: string
  ) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const landmarkDetector = useRef<LandmarkDetector | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const finalLandmarks = useRef<
    {
      timeFromStart: number;
      landmarks: Landmark[];
    }[]
  >([]); // Store final landmarks from all frames
  const [modelLoaded, setModelLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const recordDuration = 5; // seconds
  const [now, setNow] = useState(Date.now());
  const [recordingStartTime, setRecordingStartTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update recording start time when recording starts
  useEffect(() => {
    if (isRecording) {
      setRecordingStartTime(Date.now());
    }
  }, [isRecording]);

  // Load the ML model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setStatusMessage("Loading AI model...");
        landmarkDetector.current = new LandmarkDetector();
        await landmarkDetector.current.loadModel();
        setModelLoaded(true);
        setStatusMessage("");
      } catch (error) {
        console.error("Error loading model:", error);
        setStatusMessage("Failed to load AI model. Restart the app.");
      }
    };

    loadModel();
    return () => {
      if (landmarkDetector.current) {
        landmarkDetector.current.dispose();
        landmarkDetector.current = null;
      }
    };
  }, []);

  const handleRecordVideo = async () => {
    if (!cameraRef.current || !cameraReady || isRecording) return;

    try {
      setIsRecording(true);
      setStatusMessage("Recording... (0:30)");

      const res = await cameraRef.current.recordAsync({
        maxDuration: recordDuration,
      });

      if (!res?.uri) {
        setStatusMessage("Recording failed. Try again.");
        return;
      }
      setIsRecording(false);
      processVideoFrames(res.uri);
    } catch (error) {
      console.error("Recording failed:", error);
      setStatusMessage("Recording error. Try again.");
    } finally {
      setIsRecording(false);
    }
  };

  const processVideoFrames = async (videoUri: string) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const frameDir = `${FileSystem.cacheDirectory}video_frames/`;
      await FileSystem.deleteAsync(frameDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(frameDir, { intermediates: true });

      const durationMs = recordDuration * 1000;
      const fps = 10; // Process 2 frames per second
      const interval = 1000 / fps;
      const totalFrames = Math.floor(durationMs / interval);

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const time = frameIndex * interval;
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            quality: 1,
            time,
          });
          const newUri = `${frameDir}frame_${String(frameIndex).padStart(3, "0")}.jpg`;
          await FileSystem.moveAsync({ from: uri, to: newUri });

          if (landmarkDetector.current) {
            const landmarks =
              await landmarkDetector.current.detectLandmarks(newUri);
            if (landmarks && landmarks.length > 0) {
              finalLandmarks.current.push({
                timeFromStart: frameIndex * interval,
                landmarks,
              });
            }
          }

          const progress = Math.floor(((frameIndex + 1) / totalFrames) * 100);
          setProcessingProgress(progress);
          setStatusMessage(`Processing... ${progress}%`);
        } catch (e) {
          console.warn(`Frame error:`, e);
        }
      }

      setStatusMessage("Analysis complete!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (error) {
      console.error("Processing failed:", error);
      setStatusMessage("Processing failed. Try again.");
    } finally {
      setIsProcessing(false);
      onLandmarksDetected?.(finalLandmarks.current, videoUri);
      finalLandmarks.current = []; // Reset for next recording
    }
  };

  // Permission states
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.message}>
          We need access to your camera to analyze movements
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        flash="off"
        facing="front"
        mode="video"
        mute={true}
        ref={cameraRef}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Status overlay */}
      <View style={styles.statusOverlay}>
        {statusMessage ? (
          <View style={styles.statusBubble}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}
      </View>

      {/* Control bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            (isProcessing || !modelLoaded) && styles.disabledButton,
          ]}
          onPress={handleRecordVideo}
          disabled={isProcessing || !modelLoaded}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.recordButtonText}>
              {isRecording ? "STOP" : "RECORD"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.durationText}>
            {isRecording
              ? `00:${Math.max(Math.floor((now - recordingStartTime) / 1000), 0)
                  .toString()
                  .padStart(2, "0")}`
              : "00:30"}
          </Text>
          <Text style={styles.infoText}>
            {modelLoaded ? "Ready to record" : "Loading AI model..."}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  camera: {
    flex: 1,
  },
  controlBar: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(30,30,30,0.8)",
    borderRadius: 25,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.2)",
  },
  recordingButton: {
    backgroundColor: "#4A4A4A",
    borderRadius: 10,
    width: 60,
    height: 60,
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  recordButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 20,
  },
  durationText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  infoText: {
    color: "#aaa",
    fontSize: 14,
  },
  statusOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  statusBubble: {
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statusText: {
    color: "white",
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: "#4a86e8",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 30,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  message: {
    color: "#ddd",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
