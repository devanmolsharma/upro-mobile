import { CameraView, useCameraPermissions } from "expo-camera";
import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as THREE from "three";
import { LandmarkDetector } from "./LandmarkDetector/loader";
import { Landmark } from "./LandmarkDetector/strategies/Strategy";

export default function CameraFeed() {
  const [permission, requestPermission] = useCameraPermissions();
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const landmarkObjectsRef = useRef<Landmark[]>([]);
  const cameraRef = useRef<CameraView>(null);
  const landmarkDetector = useRef<LandmarkDetector | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Load the ML model once
  useEffect(() => {
    landmarkDetector.current = new LandmarkDetector();
    landmarkDetector.current.loadModel().catch((error) => {
      console.error("Error loading model:", error);
    });
  }, []);

  // Frame processing interval
  useEffect(() => {
    let isActive = true;
    if (!cameraReady || !landmarkDetector.current) return;

    const interval = setInterval(async () => {
      try {
        const camera = cameraRef.current;
        if (!camera || !isActive) return;

        const photo = await camera.takePictureAsync({
          base64: true,
          skipProcessing: true,
          imageType: "jpg",
        });

        if (photo.base64 && isActive) {
          if (!landmarkDetector.current) return;
          const detected = await landmarkDetector.current.detectLandmarks(
            photo.base64,
            photo.uri
          );
          const normalized = detected || [];
          setLandmarks(normalized);
          landmarkObjectsRef.current = normalized;
        }
      } catch (err) {
        if (isActive) {
          console.error("Error during frame processing:", err);
        }
      }
    }, 10);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [cameraReady]);

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

      {/* Status Overlay */}
      <View style={styles.statusBar}>
        {!cameraReady && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Initializing</Text>
          </View>
        )}
        <Text style={styles.landmarkCount}>
          {landmarks.length} landmarks detected
        </Text>
      </View>

      {/* 3D Visualization Panel */}
      <View style={styles.visualizationPanel}>
        <Text style={styles.panelTitle}>3D LANDMARKS</Text>
        <GLView
          style={styles.glView}
          onContextCreate={async (gl) => {
            // Setup Three.js renderer
            const renderer = new Renderer({ gl });
            renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

            // Create scene
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x121212);

            // Add coordinate axes
            const axesHelper = new THREE.AxesHelper(0.5);
            scene.add(axesHelper);

            // Setup camera - better positioning
            const camera = new THREE.PerspectiveCamera(
              60, // Wider field of view
              gl.drawingBufferWidth / gl.drawingBufferHeight,
              0.01,
              100
            );
            camera.position.set(0, 0, 1.5);
            camera.lookAt(0, 0, 0);

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(0.5, 0.5, 1);
            scene.add(directionalLight);

            // Store landmark objects
            const landmarkObjects: THREE.Mesh[] = [];

            // Animation loop
            const animate = () => {
              requestAnimationFrame(animate);

              // Update landmarks
              if (landmarkObjectsRef.current.length > 0) {
                // Clear previous landmarks
                landmarkObjects.forEach((obj) => scene.remove(obj));
                landmarkObjects.length = 0;

                // Create new landmarks with better visualization
                landmarkObjectsRef.current.forEach((lm) => {
                  const z = lm.z || 0;

                  // More visible size
                  const size = 0.03 + z * 0.02;

                  // Depth-based coloring
                  const depthColor = new THREE.Color(
                    1 - Math.min(1, Math.abs(z) * 2),
                    Math.min(1, 0.8 - Math.abs(z) * 0.5),
                    0.4 + Math.min(0.6, Math.abs(z))
                  );

                  const landmarkMaterial = new THREE.MeshPhongMaterial({
                    color: depthColor,
                    shininess: 80,
                  });

                  const landmarkGeometry = new THREE.SphereGeometry(
                    size,
                    16,
                    16
                  );
                  const landmark = new THREE.Mesh(
                    landmarkGeometry,
                    landmarkMaterial
                  );

                  // Better positioning
                  landmark.position.set(
                    -lm.x * 0.8,
                    -lm.y * 0.8,
                    z * 0.5 // Scale z for better visibility
                  );

                  scene.add(landmark);
                  landmarkObjects.push(landmark);
                });
              }

              // Smooth rotation
              scene.rotation.y += 0.005;
              scene.rotation.x += 0.002;

              renderer.render(scene, camera);
              gl.endFrameEXP();
            };

            animate();
          }}
        />
      </View>
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
    bottom: 30,
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
