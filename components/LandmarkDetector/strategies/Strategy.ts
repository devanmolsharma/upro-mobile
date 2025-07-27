import * as tf from "@tensorflow/tfjs";

export abstract class Strategy {
  /**
   * Parses a base64 encoded image string into a 3D Tensor.
   * In a mobile/React Native environment, we don't have access to the DOM (e.g., Image, Canvas).
   * Instead, we decode the image data directly into a tensor that TensorFlow.js can understand.
   * @param imageBase64Url The base64 encoded image string.
   * @returns A Promise that resolves with a 3D Tensor representing the image, or null on failure.
   */
  abstract parseImage(fileUri: string): Promise<tf.Tensor3D | null>;

  /**
   * Loads the BlazePose model detector.
   * This method initializes TensorFlow.js and creates the pose detector instance
   * configured for the mobile runtime.
   */
  abstract loadModel(): Promise<void>;

  /**
   * Detects pose landmarks from an image tensor.
   * @param imageTensor The 3D Tensor representing the image.
   * @param conf The minimum confidence score for a keypoint to be considered valid.
   * @returns A Promise that resolves with an array of filtered keypoints.
   */
  abstract detectLandmarks(
    imageTensor: tf.Tensor3D,
    conf: number
  ): Promise<Landmark[]>;
}

export type Landmark = {
  x: number;
  y: number;
  z?: number; // Optional z coordinate for 3D landmarks
  score?: number; // Confidence score for the landmark detection
  name?: string; // Optional name for the landmark
};
