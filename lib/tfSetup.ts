/**
 * TensorFlow.js setup for React Native
 * This file should be imported at the app startup to properly initialize TensorFlow.js
 */
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-react-native';
import { Platform } from 'react-native';

let isInitialized = false;

/**
 * Initialize TensorFlow.js for React Native with GPU acceleration
 * Call this function at app startup, preferably in your App.tsx or _layout.tsx
 */
export const initializeTensorFlow = async (): Promise<void> => {
  if (isInitialized) {
    console.log('TensorFlow.js already initialized');
    return;
  }

  try {
    console.log('Initializing TensorFlow.js for React Native...');
    console.log(`Platform: ${Platform.OS}`);

    // Platform-specific setup
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Try to use WebGL backend for GPU acceleration
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js initialized with WebGL backend (GPU acceleration)');
      } catch (webglError) {
        console.warn('WebGL backend failed, falling back to CPU:', webglError);
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('TensorFlow.js initialized with CPU backend');
      }
    } else {
      // For web platform
      await tf.ready();
      console.log('TensorFlow.js initialized for web platform');
    }

    console.log(`Active backend: ${tf.getBackend()}`);
    console.log(`TensorFlow.js version: ${tf.version.tfjs}`);
    
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize TensorFlow.js:', error);
    throw error;
  }
};

/**
 * Get the current TensorFlow.js initialization status
 */
export const isTensorFlowInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Get information about the current TensorFlow.js setup
 */
export const getTensorFlowInfo = () => {
  if (!isInitialized) {
    return {
      initialized: false,
      backend: null,
      version: null,
      platform: Platform.OS,
    };
  }

  return {
    initialized: true,
    backend: tf.getBackend(),
    version: tf.version.tfjs,
    platform: Platform.OS,
  };
};
