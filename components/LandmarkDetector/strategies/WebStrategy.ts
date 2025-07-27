import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import { Strategy } from "./Strategy";

export class WebStrategy extends Strategy {
  private detector: poseDetection.PoseDetector | null = null;

  /**
   * Parses a base64 encoded image string into a 3D Tensor.
   * In a mobile/React Native environment, we don't have access to the DOM (e.g., Image, Canvas).
   * Instead, we decode the image data directly into a tensor that TensorFlow.js can understand.
   * @param imageBase64Url The base64 encoded image string.
   * @returns A Promise that resolves with a 3D Tensor representing the image, or null on failure.
   */
  async parseImage(imageBase64Url: string): Promise<tf.Tensor3D | null> {
    try {
      // Ensure the base64 string is clean of the data URI prefix.
      const res = await fetch(imageBase64Url);
      const arrayBuffer = await res.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      // Use the optimized 'decodeJpeg' from the React Native adapter.
      // This creates a 3D tensor of shape [height, width, channels].
      const imageTensor = decodeJpeg(imageData);
      return imageTensor;
    } catch (error) {
      console.error("Error parsing image on Mobile:", error);
      return null;
    }
  }

  /**
   * Loads the BlazePose model detector.
   * This method initializes TensorFlow.js and creates the pose detector instance
   * configured for the mobile runtime.
   */
  async loadModel(): Promise<void> {
    console.log("Loading pose detection model for Mobile");
    // Ensure the TensorFlow.js backend is ready.
    await tf.ready();
    try {
      // TODO: Load the model from a local path or bundled resource.
      // For mobile, you might bundle the model with your app.
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {
          runtime: "tfjs", // 'tfjs' is the correct runtime here.
          modelType: "full", // 'lite' is ideal for mobile performance.
        }
      );
      console.log("Pose detector loaded successfully for Mobile");
    } catch (error) {
      console.error("Error loading pose detector for Mobile:", error);
      throw error;
    }
  }

  /**
   * Detects pose landmarks from an image tensor.
   * @param imageTensor The 3D Tensor representing the image.
   * @param conf The minimum confidence score for a keypoint to be considered valid.
   * @returns A Promise that resolves with an array of filtered keypoints.
   */
  async detectLandmarks(imageTensor: tf.Tensor3D, conf: number): Promise<any> {
    if (!this.detector) {
      throw new Error("Pose detector not loaded");
    }
    if (!imageTensor) {
      throw new Error("Image tensor is invalid");
    }
    console.log("Detecting landmarks on Mobile using pose-detection");

    try {
      // Estimate poses directly from the image tensor.
      const poses = await this.detector.estimatePoses(imageTensor);

      tf.dispose(imageTensor);

      if (poses && poses.length > 0) {
        // Use 3D keypoints if available, otherwise fall back to 2D.
        const keypoints = poses[0].keypoints3D || poses[0].keypoints;
        const filtered = keypoints.filter((kp) => (kp.score || 0) >= conf);
        return filtered;
      }

      // Return an empty array if no poses are detected.
      return [];
    } catch (error) {
      // Ensure tensor is disposed even if an error occurs.
      tf.dispose(imageTensor);
      console.error("Error detecting landmarks on Mobile:", error);
      throw error;
    }
  }
}
