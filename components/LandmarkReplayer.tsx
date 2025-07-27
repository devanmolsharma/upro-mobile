import { GLView } from "expo-gl";
import { Renderer } from "expo-three";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import * as THREE from "three";
import { Landmark } from "./LandmarkDetector/strategies/Strategy";

interface LandmarkReplayerProps {
  landmarkInfo: {
    timeFromStart: number;
    landmarks: Landmark[];
  }[];
  videoUri: string;
  replaySpeed?: number;
  loop?: boolean;
}

const LandmarkReplayer: React.FC<LandmarkReplayerProps> = ({
  landmarkInfo,
  videoUri,
  replaySpeed = 1.0,
  loop = true,
}) => {
  const window = Dimensions.get("window");
  const overlaySize = Math.min(window.width, window.height) * 0.3;
  const overlayPosition = 10;

  // Video player setup
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = loop;
    player.play();
  });

  // Independent landmark animation
  const landmarkIndexRef = useRef<Landmark[]>([...landmarkInfo[0].landmarks]);

  useEffect(() => {
    if (!landmarkInfo.length) return;
    let landmarkIndex = 0;

    const interval = setInterval(() => {
      landmarkIndexRef.current = landmarkInfo[landmarkIndex].landmarks;
      landmarkIndex = (landmarkIndex + 1) % landmarkInfo.length;
    }, 100); // Update landmarks every 100ms

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen video */}
      <VideoView
        player={player}
        style={styles.video}
        allowsFullscreen
        allowsPictureInPicture
      />

      {/* 3D Landmark Overlay */}
      <View
        style={[
          styles.overlay,
          {
            top: 30,
            left: 30,
            width: overlaySize,
            height: overlaySize,
          },
        ]}
      >
        <GLView
          style={styles.glView}
          onContextCreate={async (gl) => {
            const renderer = new Renderer({ gl });
            renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000000);

            const camera = new THREE.PerspectiveCamera(
              60,
              gl.drawingBufferWidth / gl.drawingBufferHeight,
              0.01,
              100
            );
            camera.position.set(0, 0, 2);
            camera.lookAt(0, 0, 0);

            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(0.5, 0.5, 1);
            scene.add(dirLight);

            const landmarkMeshes: THREE.Mesh[] = [];
            const connectionLines: THREE.Line[] = [];
            const connectionMaterial = new THREE.LineBasicMaterial({
              color: 0x00ff00,
            });

            const sphereMaterial = new THREE.MeshPhongMaterial({
              color: new THREE.Color(0, 1, 0.5),
              shininess: 30,
            });

            const sphereGeometry = new THREE.SphereGeometry(0.015, 8, 8);

            // === INIT: create meshes/lines only once ===
            for (let i = 0; i < 33; i++) {
              const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
              scene.add(mesh);
              landmarkMeshes.push(mesh);
            }

            const connections = [
              // Face connections
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 7],
              [0, 4],
              [4, 5],
              [5, 6],
              [6, 8],
              [0, 9],
              [9, 10],
              [10, 0],

              // Upper body
              [11, 12],
              [11, 13],
              [13, 15],
              [12, 14],
              [14, 16],
              [15, 17],
              [15, 19],
              [15, 21],
              [16, 18],
              [16, 20],
              [16, 22],

              // Core
              [11, 23],
              [12, 24],
              [23, 24],

              // Legs
              [23, 25],
              [25, 27],
              [27, 29],
              [29, 31],
              [24, 26],
              [26, 28],
              [28, 30],
              [30, 32],
              [27, 31],
              [28, 32],
            ];
            connections.forEach(([startIdx, endIdx]) => {
              const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(),
                new THREE.Vector3(),
              ]);
              const line = new THREE.Line(geometry, connectionMaterial);
              scene.add(line);
              connectionLines.push(line);
            });
            let lastRenderTime = 0;
            const frameRate = 1000 / 10; // ~10 FPS

            const animate = (time: number) => {
              if (time - lastRenderTime < frameRate) return;
              lastRenderTime = time;
              requestAnimationFrame(animate);
              if (!landmarkIndexRef.current) return;

              try {
                const lmData = landmarkIndexRef.current;
                if (lmData.length === 33) {
                  // Update landmark positions
                  for (let i = 0; i < 33; i++) {
                    const lm = lmData[i];
                    landmarkMeshes[i].position.set(
                      -lm.x,
                      -lm.y,
                      (lm.z || 0) * 0.5
                    );
                  }

                  // Update line geometry
                  connections.forEach(([startIdx, endIdx], i) => {
                    const line = connectionLines[i];
                    const positions = new Float32Array([
                      ...landmarkMeshes[startIdx].position.toArray(),
                      ...landmarkMeshes[endIdx].position.toArray(),
                    ]);
                    line.geometry.setAttribute(
                      "position",
                      new THREE.BufferAttribute(positions, 3)
                    );
                    line.geometry.computeBoundingSphere();
                    line.geometry.attributes.position.needsUpdate = true;
                  });
                }

                renderer.render(scene, camera);
                gl.endFrameEXP();
              } catch (error) {
                console.error("Error during rendering:", error);
              }
            };

            animate(0);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    overflow: "hidden",
  },
  glView: {
    flex: 1,
  },
});

export default LandmarkReplayer;
