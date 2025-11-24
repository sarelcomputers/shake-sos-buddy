# Voice Detection Setup - Always-On Listening

## Overview
The voice detection feature allows the SOS system to be triggered by speaking a password, even when the device screen is dimmed or locked.

## How It Works
When voice detection is enabled:
1. **Wake Lock**: The app keeps the device awake using KeepAwake plugin
2. **Continuous Listening**: The microphone continuously listens for your password
3. **Background Operation**: Works even when the screen is dimmed (but not fully locked)

## Required Permissions

### Android
Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Required for voice detection -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Keep these inside the <application> tag -->
<application>
  <!-- ... other config ... -->
  
  <!-- Foreground service for continuous voice detection -->
  <service
    android:name=".VoiceDetectionService"
    android:foregroundServiceType="microphone"
    android:enabled="true"
    android:exported="false" />
</application>
```

### iOS
Add these to `ios/App/App/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access to detect your emergency voice password</string>
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```

## Battery Optimization (Android)

For reliable voice detection, you must disable battery optimization:

### Method 1: Prompt User (Recommended)
The app will automatically prompt users to disable battery optimization when they enable voice detection.

### Method 2: Manual Setup
1. Open **Settings** → **Apps** → **Alfa22 SOS**
2. Select **Battery** → **Battery optimization**
3. Change from "Optimize" to **"Don't optimize"**

## Usage Instructions

1. **Set Voice Password**: Go to Settings tab and set a unique voice password
2. **Enable Voice Alert**: Toggle on the "Voice Alert" switch
3. **Arm System**: Press the power button to arm the SOS system
4. **Device Stays Awake**: Your device will stay awake (screen may dim but won't lock)
5. **Speak Password**: When you need help, speak your password
6. **Confirm**: Say "yes" when asked "Do you need help?"

## Technical Details

### Wake Lock Behavior
- **Screen Dimming**: Screen will dim to save battery but microphone stays active
- **Battery Impact**: Moderate - similar to playing music in background
- **Automatic Release**: Wake lock is released when you disarm the system

### Web Speech API
- Uses browser's native speech recognition
- Works on Chrome/Android and Safari/iOS
- No internet required for basic recognition (depends on device)

### Limitations

#### Android
- Device must not be in Doze mode (disable battery optimization)
- Some manufacturers (Samsung, Xiaomi) may require additional settings
- Microphone quality affects recognition accuracy

#### iOS
- iOS restricts background audio unless app is "active"
- Wake lock keeps app active but screen must stay on
- iOS may terminate app if memory pressure is high

## Troubleshooting

### Voice Detection Not Working When Locked
1. Check battery optimization is disabled
2. Ensure wake lock permission is granted
3. Keep screen on (can dim but not lock)

### Battery Draining Fast
- This is expected when voice detection is enabled
- The device must stay partially awake to listen
- Consider using shake detection instead for lower battery impact

### Recognition Accuracy Issues
1. Speak clearly and at normal volume
2. Reduce background noise
3. Choose a distinct password (2-3 words works best)
4. Test in a quiet environment first

## Best Practices

1. **Password Choice**:
   - Use 2-3 clear words: "help me now", "emergency alert"
   - Avoid common words you might say accidentally
   - Test the password in different conditions

2. **Battery Management**:
   - Keep device charged when voice detection is active
   - Consider using power bank or car charger
   - Alternatively, use shake detection for longer battery life

3. **Testing**:
   - Always test your voice password before relying on it
   - Test in different noise conditions
   - Verify the confirmation prompt works

## Comparison: Voice vs Shake Detection

| Feature | Voice Detection | Shake Detection |
|---------|----------------|-----------------|
| Hands-free | ✅ Yes | ❌ No |
| Battery Impact | 🔴 High | 🟡 Medium |
| Accuracy | 🟡 Varies | ✅ High |
| Works When Locked | 🟡 Screen must dim, not lock | ✅ Yes, fully locked |
| Setup Complexity | 🔴 Requires permissions | 🟢 Simple |

## Security Considerations

1. **Privacy**: Voice data is processed locally on device (Web Speech API)
2. **False Triggers**: Choose a unique password to avoid accidental activation
3. **Public Spaces**: Be aware others might hear your password
4. **Confirmation**: Always say "yes" when asked to confirm

## Advanced Configuration

For developers building the app:

```bash
# Sync permissions to native platforms
npx cap sync

# Test on physical device (required for voice detection)
npx cap run android
# or
npx cap run ios

# Build production APK with wake lock
npm run build
npx cap sync
```

## Further Reading

- [Android Wake Lock Documentation](https://developer.android.com/training/scheduling/wakelock)
- [iOS Background Modes](https://developer.apple.com/documentation/avfoundation/audio_playback_recording_and_processing/recording_audio)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
