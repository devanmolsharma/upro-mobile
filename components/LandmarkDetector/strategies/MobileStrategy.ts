import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Landmark, Strategy } from "./Strategy";

// The MobileStrategy is designed to work in a React Native environment for both iOS and Android.
// It uses TensorFlow.js with the React Native adapter (@tensorflow/tfjs-react-native)
// to perform pose detection on mobile devices.
export class MobileStrategy extends Strategy {
  private detector: poseDetection.PoseDetector | null = null;

  async parseImage(imageBase64Url: string): Promise<tf.Tensor3D | null> {
    console.log("Parsing image on Mobile");
    try {
      const res = await fetch(imageBase64Url);
      const arrayBuffer = await res.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      const imageTensor = decodeJpeg(imageData);
      return imageTensor;
    } catch (error) {
      console.error("Error parsing image on Mobile:", error);
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
          modelType: "lite", // 'lite' is ideal for mobile performance
        }
      );
      console.log("Pose detector loaded successfully for Mobile");
    } catch (error) {
      console.error("Error loading pose detector for Mobile:", error);
      throw error;
    }
  }

  async detectLandmarks(imageTensor: tf.Tensor3D, conf: number): Promise<Landmark[]> {
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
