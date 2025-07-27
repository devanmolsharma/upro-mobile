import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { Landmark, Strategy } from "./Strategy";

// The MobileStrategy is designed to work in a React Native environment for both iOS and Android.
// It uses TensorFlow.js with the React Native adapter (@tensorflow/tfjs-react-native)
// to perform pose detection on mobile devices.
export class MobileStrategy extends Strategy {
  dispose() {
    if (this.detector) {
      this.detector.dispose();
    }
  }
  private detector: poseDetection.PoseDetector | null = null;

  async parseImage(fileUri: string): Promise<tf.Tensor3D | null> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        fileUri,
        [{ resize: { width: 224, height: 224 } }],
        {
          base64: true,
        }
      );
      if (!result.base64) {
        throw new Error("Failed to get base64 from image manipulation");
      }
      // Convert base64 to byte array
      const byteCharacters = atob(result.base64); // Replace with custom atob if in React Native
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Decode JPEG to tensor
      let imageTensor = decodeJpeg(byteArray); // shape: [H, W, 3]

      // Resize to smaller resolution
      const targetHeight = 192;
      const targetWidth = 192;
      imageTensor = tf.image.resizeBilinear(imageTensor, [
        targetHeight,
        targetWidth,
      ]);

      return imageTensor;
    } catch (err) {
      console.error("Error decoding image tensor:", err);
      return null;
    }
  }

  async loadModel(): Promise<void> {
    console.log("Loading pose detection model for Mobile");
    await tf.ready();
    try {
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {
          runtime: "tfjs",
          modelType: "heavy", // 'lite' is ideal for mobile performance
        }
      );
      console.log("Pose detector loaded successfully for Mobile");
    } catch (error) {
      console.error("Error loading pose detector for Mobile:", error);
      throw error;
    }
  }

  async detectLandmarks(
    imageTensor: tf.Tensor3D,
    conf: number
  ): Promise<Landmark[]> {
    if (!this.detector) {
      throw new Error("Pose detector not loaded");
    }
    if (!imageTensor) {
      throw new Error("Image tensor is invalid");
    }
    console.log("Detecting landmarks on Mobile using pose-detection");
    try {
      const poses = await this.detector.estimatePoses(imageTensor);
      tf.dispose(imageTensor);
      if (poses && poses.length > 0) {
        const keypoints = poses[0].keypoints3D || poses[0].keypoints;
        const filtered = keypoints.filter((kp: any) => (kp.score || 0) >= conf);
        return filtered.map((kp: any) => ({
          x: kp.x,
          y: kp.y,
          z: kp.z,
          score: kp.score,
          name: kp.name,
        }));
      }
      return [];
    } catch (error) {
      tf.dispose(imageTensor);
      console.error("Error detecting landmarks on Mobile:", error);
      throw error;
    }
  }
}
