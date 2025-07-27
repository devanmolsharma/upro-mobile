import { Strategy } from "./Strategy";

// The MobileStrategy is designed to work in a React Native environment for both iOS and Android.
// It uses TensorFlow.js with the React Native adapter (@tensorflow/tfjs-react-native)
// to perform pose detection on mobile devices.
export class MobileStrategy extends Strategy {}
