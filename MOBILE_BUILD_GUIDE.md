# Mobile Build Guide for AiMi

This guide explains how to prepare AiMi for mobile deployment on Android and iOS platforms.

## Current Status

AiMi is currently built as an Electron desktop application. To deploy to mobile platforms, we have two main options:

### Option 1: Capacitor (Recommended)
Capacitor by Ionic allows you to wrap your existing web application for mobile deployment with minimal changes.

**Advantages:**
- Minimal code changes required
- Keep existing React codebase
- Native plugin system
- Good performance
- Supports both iOS and Android from the same codebase

**Implementation Steps:**

1. **Install Capacitor**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
```

2. **Initialize Capacitor**
```bash
npx cap init
```

3. **Add Mobile Platforms**
```bash
npx cap add android
npx cap add ios
```

4. **Build for Web**
```bash
npm run build:renderer
```

5. **Copy to Native Projects**
```bash
npx cap copy
npx cap sync
```

6. **Open in Native IDEs**
```bash
# For Android
npx cap open android

# For iOS (requires macOS)
npx cap open ios
```

### Option 2: React Native
Rebuild the app using React Native for truly native performance.

**Advantages:**
- Better performance
- More native feel
- Access to all native APIs

**Disadvantages:**
- Requires significant rewrite
- Separate codebase for mobile
- More maintenance

## Capacitor Configuration

Add this to your `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aimi.app',
  appName: 'AiMi',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0A0A0C",
      showSpinner: false
    }
  }
};

export default config;
```

## Required Changes for Mobile

### 1. Remove Electron-Specific Code

The app currently uses `window.electronAPI` for:
- Ollama API calls
- Memory management
- Image handling
- Window mode changes

For mobile, replace these with:
- Direct HTTP calls to Ollama (if running locally) or API gateway
- LocalStorage/IndexedDB for memory
- Camera/Photo picker plugins
- Remove window mode functionality

### 2. Update API Communication

Instead of IPC, use HTTP/REST:

```typescript
// Replace electronAPI.ollama.chat with:
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: selectedModel,
    messages: messages,
    options: options
  })
});
```

### 3. Mobile-Specific Plugins

Install Capacitor plugins for mobile features:

```bash
# Camera access
npm install @capacitor/camera

# Filesystem
npm install @capacitor/filesystem

# Preferences (storage)
npm install @capacitor/preferences

# Network information
npm install @capacitor/network
```

### 4. Responsive Design

The app already has responsive CSS. Additional considerations:
- Safe area insets for notched devices
- Keyboard handling
- Touch gestures
- Pull-to-refresh

## Android Build Process

### Prerequisites
- Android Studio installed
- Android SDK
- Java Development Kit (JDK) 11+

### Steps

1. **Prepare the app**
```bash
npm run build:renderer
npx cap copy android
npx cap sync android
```

2. **Open in Android Studio**
```bash
npx cap open android
```

3. **Configure**
- Set package name in `android/app/build.gradle`
- Configure app icons in `android/app/src/main/res/`
- Update permissions in `android/app/src/main/AndroidManifest.xml`

4. **Build APK**
- In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
- Or via command line:
```bash
cd android
./gradlew assembleRelease
```

5. **Install on device**
```bash
adb install app/build/outputs/apk/release/app-release.apk
```

## iOS Build Process

### Prerequisites
- macOS (required for iOS development)
- Xcode installed
- Apple Developer account

### Steps

1. **Prepare the app**
```bash
npm run build:renderer
npx cap copy ios
npx cap sync ios
```

2. **Open in Xcode**
```bash
npx cap open ios
```

3. **Configure**
- Set bundle identifier
- Configure app icons in Assets.xcassets
- Set up code signing with your Apple Developer account
- Update Info.plist with required permissions

4. **Build**
- Select your device/simulator in Xcode
- Product > Build
- Product > Archive (for release)

5. **Deploy**
- TestFlight for beta testing
- App Store Connect for production release

## Ollama Integration on Mobile

### Challenge
Ollama requires a local server, which is difficult on mobile.

### Solutions

#### Option A: Remote Ollama Server
- Run Ollama on a server
- Connect mobile app to server via HTTPS
- Requires network connection

#### Option B: Cloud API Gateway
- Use OpenAI-compatible API
- Or hosted LLM service
- More reliable but requires API key

#### Option C: On-Device LLM (Advanced)
- Use smaller models that can run on device
- Integrate llama.cpp or similar
- Best privacy but limited model sizes

## Security Considerations

### For Mobile Deployment:

1. **API Keys**: Store securely using Capacitor Preferences with encryption
2. **Network Security**: Use HTTPS for all API calls
3. **Data Storage**: Encrypt sensitive conversation data
4. **Permissions**: Request only necessary permissions
5. **Code Obfuscation**: Enable ProGuard (Android) and code obfuscation (iOS)

## Testing

### Android
```bash
# Run in emulator
npx cap run android

# Run on device
npx cap run android --target=<device-id>
```

### iOS
```bash
# Run in simulator
npx cap run ios

# Run on device (requires provisioning)
npx cap run ios --target=<device-id>
```

## App Store Submission

### Android (Google Play)
1. Create signed APK/AAB
2. Create Google Play developer account ($25 one-time)
3. Prepare store listing (screenshots, description)
4. Submit for review

### iOS (App Store)
1. Create archive in Xcode
2. Apple Developer account ($99/year)
3. Prepare App Store Connect listing
4. Submit for review

## Continuous Integration

Consider setting up:
- GitHub Actions for automated builds
- Fastlane for iOS/Android deployment automation
- EAS Build (Expo Application Services) for cloud builds

## Next Steps

1. Choose between Capacitor and React Native
2. Set up development environment
3. Implement platform detection and conditional code
4. Test on physical devices
5. Prepare app store assets (icons, screenshots, descriptions)
6. Submit to app stores

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)
- [iOS Developer Guide](https://developer.apple.com/)
