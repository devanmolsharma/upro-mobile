import { Tensor3D } from "@tensorflow/tfjs";
import { Landmark, Strategy } from "./Strategy";

// The MobileStrategy is designed to work in a React Native environment for both iOS and Android.
// It uses TensorFlow.js with the React Native adapter (@tensorflow/tfjs-react-native)
// to perform pose detection on mobile devices.
export class MobileStrategy extends Strategy {
  parseImage(imageBase64Url: string): Promise<Tensor3D | null> {
    throw new Error("Method not implemented.");
  }
  loadModel(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  detectLandmarks(imageTensor: Tensor3D, conf: number): Promise<Landmark[]> {
    throw new Error("Method not implemented.");
  }
}
