import { Platform } from "react-native";
import { Strategy } from "./strategies/Strategy";

export class LandmarkDetector {
  private strategy: Strategy;
  constructor() {
    if (Platform.OS === "web") {
      const WebStrategy = require("./strategies/WebStrategy").WebStrategy;
      this.strategy = new WebStrategy();
    } else if (Platform.OS === "android" || Platform.OS === "ios") {
      const MobileStrategy =
        require("./strategies/MobileStrategy").MobileStrategy;
      this.strategy = new MobileStrategy();
    } else {
      throw new Error("Unsupported platform");
    }
  }

  async loadModel() {
    try {
      await this.strategy.loadModel();
      console.log("Model loaded successfully");
    } catch (error) {
      console.error("Error loading model:", error);
    }
  }

  async detectLandmarks(fileUri: string) {
    try {
      const imageData = await this.strategy.parseImage(fileUri);
      if (!imageData) {
        throw new Error("Failed to parse image data");
      }
      const landmarks = await this.strategy.detectLandmarks(imageData, 0);
      return landmarks;
    } catch (error) {
      console.error("Error detecting landmarks:", error);
      throw error;
    }
  }
  dispose() {
    return this.strategy.dispose();
  }
}
