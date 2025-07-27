import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Landmark, Strategy } from "./Strategy";

export class WebStrategy extends Strategy {
  dispose(): Promise<void> {
    if (this.detector) {
      this.detector.dispose();
    }
    return Promise.resolve();
  }
  private detector: poseDetection.PoseDetector | null = null;

  async parseImage(imageBase64Url: string): Promise<tf.Tensor3D | null> {
    try {
      const res = await fetch(imageBase64Url);
      const arrayBuffer = await res.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);
      const imageTensor = decodeJpeg(imageData);
      return imageTensor;
    } catch (error) {
      console.error("Error parsing image on Web:", error);
      return null;
    }
  }

  /**
   * Loads the BlazePose model detector for web.
   * This method initializes TensorFlow.js and creates the pose detector instance
   * configured for the web runtime.
   */
  async loadModel(): Promise<void> {
    console.log("Loading pose detection model for Web");
    await tf.ready();
    try {
      const success = await tf.setBackend("webgpu");
      if (!success) {
        const successWebgl = await tf.setBackend("webgl");
        if (!successWebgl) {
          throw new Error("Failed to set WebGL backend or WebGPU backend");
        } else {
          console.log("WebGL backend set successfully");
        }
      } else {
        console.log("WebGPU backend set successfully");
      }
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {
          runtime: "tfjs",
          modelType: "full",
        }
      );
      console.log("Pose detector loaded successfully for Web");
    } catch (error) {
      console.error(
        "Error setting backend or loading pose detector for Web:",
        error
      );
      await tf.setBackend("cpu");
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
    console.log("Detecting landmarks on Web using pose-detection");
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
      console.error("Error detecting landmarks on Web:", error);
      throw error;
    }
  }
}
