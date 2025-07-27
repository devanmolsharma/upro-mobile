# MobileStrategy for Pose Detection with GPU Acceleration

The `MobileStrategy` class provides optimized pose detection for React Native mobile applications (iOS/Android) using TensorFlow.js with GPU acceleration via WebGL backend.

## Features

- **GPU Acceleration**: Uses WebGL backend for improved performance on mobile devices
- **CPU Fallback**: Automatically falls back to CPU if WebGL is not available
- **Mobile Optimized**: Uses the "lite" BlazePose model for better mobile performance
- **Memory Management**: Proper tensor disposal to prevent memory leaks
- **Error Handling**: Comprehensive error handling with detailed logging

## Setup

### 1. Install Dependencies

The following dependencies are required:

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow-models/pose-detection @tensorflow/tfjs-backend-webgl --legacy-peer-deps
```

### 2. Initialize TensorFlow.js

Import and initialize TensorFlow.js in your app's entry point (e.g., `App.tsx` or `_layout.tsx`):

```typescript
import { initializeTensorFlow } from "./lib/tfSetup";

// In your app component or startup function
useEffect(() => {
  const initTF = async () => {
    try {
      await initializeTensorFlow();
      console.log("TensorFlow.js initialized successfully");
    } catch (error) {
      console.error("Failed to initialize TensorFlow.js:", error);
    }
  };

  initTF();
}, []);
```

## Usage

### Basic Usage

```typescript
import { LandmarkDetector } from "./components/LandmarkDetector/loader";

const detector = new LandmarkDetector();

// Load the model (call once at startup)
await detector.loadModel();

// Detect landmarks from a base64 image
const landmarks = await detector.detectLandmarks(imageBase64);
```

### Advanced Usage

```typescript
import { MobileStrategy } from "./components/LandmarkDetector/strategies/MobileStrategy";

const strategy = new MobileStrategy();

// Load the model
await strategy.loadModel();

// Parse image from different formats
const imageTensor = await strategy.parseImage(imageBase64Url);

if (imageTensor) {
  // Detect landmarks with custom confidence threshold
  const landmarks = await strategy.detectLandmarks(imageTensor, 0.6);

  // Process landmarks
  landmarks.forEach((landmark) => {
    console.log(
      `Landmark: ${landmark.name} at (${landmark.x}, ${landmark.y}) with confidence ${landmark.score}`
    );
  });
}

// Clean up when done
strategy.dispose();
```

## Image Input Formats

The `parseImage` method supports multiple image input formats:

1. **Data URI**: `data:image/jpeg;base64,/9j/4AAQ...`
2. **HTTP URL**: `https://example.com/image.jpg`
3. **Raw Base64**: `/9j/4AAQ...` (without data URI prefix)

## Configuration Options

The MobileStrategy uses the following optimized configuration:

- **Model Type**: `lite` - Optimized for mobile performance
- **Runtime**: `tfjs` - TensorFlow.js runtime
- **Smoothing**: Enabled for better tracking consistency
- **Segmentation**: Disabled to save computational resources

## Performance Considerations

### GPU Acceleration

- Uses WebGL backend for GPU acceleration when available
- Automatically falls back to CPU if WebGL fails
- Check backend status: `tf.getBackend()`

### Memory Management

- Tensors are automatically disposed after processing
- Call `dispose()` method when strategy is no longer needed
- Monitor memory usage with `tf.memory()`

### Model Performance

- The "lite" model provides good accuracy with better performance
- Consider adjusting confidence threshold based on your use case
- Lower confidence (e.g., 0.4) detects more landmarks but may include false positives
- Higher confidence (e.g., 0.7) provides more accurate but fewer landmarks

## Error Handling

The MobileStrategy includes comprehensive error handling:

- **Model Loading Errors**: Catches and logs model loading failures
- **Image Parsing Errors**: Handles invalid image data gracefully
- **Detection Errors**: Ensures tensor cleanup even when detection fails
- **Backend Errors**: Automatic fallback from WebGL to CPU

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**: Ensure all TensorFlow.js dependencies are installed
2. **WebGL Errors**: Check device WebGL support; CPU fallback should activate automatically
3. **Memory Issues**: Ensure proper tensor disposal and strategy cleanup
4. **Performance Issues**: Monitor tensor memory usage and consider reducing image resolution

### Debugging

Enable detailed logging by checking console output for:

- Backend initialization status
- Model loading progress
- Tensor shapes and memory usage
- Detection results and confidence scores

## Platform Support

- **iOS**: Full support with GPU acceleration
- **Android**: Full support with GPU acceleration
- **Web**: Uses WebStrategy (different implementation)

## Examples

See the `LandmarkDetector` loader class for integration examples and the `WebStrategy` for reference implementation patterns.
