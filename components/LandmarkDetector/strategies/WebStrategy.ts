import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import { MobileStrategy } from "./MobileStrategy";

export class WebStrategy extends MobileStrategy {
  /**
   * Loads the BlazePose model detector for web.
   * This method initializes TensorFlow.js and creates the pose detector instance
   * configured for the web runtime.
   */
  async loadModel(): Promise<void> {
    console.log("Loading pose detection model for Web");
    await super.loadModel();
    try {
      const success = await tf.setBackend("webgpu");
      if (!success) {
        const succesWebgl = await tf.setBackend("webgl");
        if (!succesWebgl) {
          throw new Error("Failed to set WebGL backend or WebGPU backend");
        } else {
          console.log("WebGL backend set successfully");
        }
      } else {
        console.log("WebGPU backend set successfully");
      }
    } catch (error) {
      console.error("Error setting WebGPU backend:", error);
      await tf.setBackend("cpu"); // Fallback to CPU if WebGPU fails
      throw error;
    }
  }
}
