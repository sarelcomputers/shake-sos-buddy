# Background Operations Setup Guide

This guide covers everything needed for the app to work when the screen is locked, app is minimized, or device is sleeping.

## What Works in Background

When properly configured, the following work even with screen locked:

| Feature | Web/PWA | Android APK | iOS App |
|---------|---------|-------------|---------|
| Shake Detection | ❌ Screen must be on | ✅ Foreground Service | ⚠️ Limited |
| Voice Detection | ⚠️ Screen dimmed only | ⚠️ Limited in background | ⚠️ Limited |
| SMS Sending | ❌ Not available | ✅ Native carrier | ⚠️ System app |
| Location Tracking | ⚠️ Limited | ✅ Background location | ⚠️ Limited |
| Push Notifications | ✅ Service Worker | ✅ FCM | ✅ APNs |

## Android APK Setup

### Required Permissions in AndroidManifest.xml

```xml
<!-- SMS - Uses device carrier/SMS bundle -->
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Notifications -->
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Audio -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Battery -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### How SMS Works on Android

When you build the APK and install it on a real device:

1. **Native SMS API**: The app uses Android's `SmsManager` API
2. **Your Carrier**: Messages are sent through your phone's SIM card
3. **Your SMS Bundle**: Uses your cellular plan's SMS allowance
4. **Works Offline**: Doesn't need WiFi - uses cellular network
5. **Permission Flow**: 
   - First SOS attempt will prompt for SEND_SMS permission
   - User must tap "Allow" 
   - Subsequent sends work automatically

### Foreground Service for Background Detection

The app includes a foreground service that:

1. Shows a persistent notification when armed
2. Continuously monitors accelerometer for shakes
3. Works even with screen off/locked
4. Survives battery optimization
5. Restarts automatically after device reboot

See `docs/ANDROID_FOREGROUND_SERVICE.md` for full setup instructions.

### Battery Optimization

For reliable background operation:

1. Go to **Settings → Apps → Alfa22 SOS**
2. Tap **Battery**
3. Select **Unrestricted** or **Don't optimize**

Device-specific instructions: [dontkillmyapp.com](https://dontkillmyapp.com)

## How to Test

### Testing on Web (Limited)
- Voice detection works when screen is dimmed (not locked)
- Shake detection requires screen to be on
- No native SMS (would need Twilio integration)

### Testing on Android APK

1. Export to GitHub: Click "Export to GitHub" button
2. Clone repository: `git clone <your-repo-url>`
3. Install dependencies: `npm install`
4. Add Android platform: `npx cap add android`
5. Build: `npm run build && npx cap sync`
6. Open in Android Studio: `npx cap open android`
7. Install Java files from `docs/ANDROID_FOREGROUND_SERVICE.md`
8. Build and run on physical device

### Verifying SMS Works

1. Arm the SOS system
2. Add a test contact (your own number)
3. Trigger an SOS (shake or voice)
4. Check if SMS is received
5. Check your carrier's SMS usage to confirm local sending

## Troubleshooting

### SMS Not Sending

1. **Permission denied**: Check Settings → Apps → Alfa22 SOS → Permissions → SMS
2. **No SIM card**: Device needs an active SIM with SMS capability
3. **Airplane mode**: Turn off airplane mode
4. **No signal**: Ensure cellular signal is available

### Shake Detection Not Working When Locked

1. **Battery optimization**: Disable for this app
2. **Foreground service**: Ensure service is running (notification visible)
3. **Sensitivity**: Adjust shake sensitivity in settings
4. **Device manufacturer**: Some phones (Xiaomi, Samsung) have aggressive battery management

### Voice Detection Not Working

1. **Microphone permission**: Ensure granted
2. **Screen state**: Voice works best with screen dimmed, not fully locked
3. **Background audio**: Some devices restrict background audio
4. **Password clarity**: Use a distinct, 2-3 word password

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                 App Armed                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌─────────────────────┐ │
│  │ Web Layer   │    │ Native Layer        │ │
│  │             │    │ (Android Only)      │ │
│  │ - Voice     │    │                     │ │
│  │   Detection │    │ - Foreground        │ │
│  │ - Wake Lock │    │   Service           │ │
│  │ - UI        │    │ - Accelerometer     │ │
│  │             │    │ - Native SMS        │ │
│  └──────┬──────┘    └──────────┬──────────┘ │
│         │                       │           │
│         └───────────┬───────────┘           │
│                     │                       │
│              ┌──────▼──────┐                │
│              │ SOS Trigger │                │
│              └──────┬──────┘                │
│                     │                       │
│    ┌────────────────┼────────────────┐      │
│    ▼                ▼                ▼      │
│ ┌──────┐      ┌──────────┐     ┌────────┐   │
│ │ SMS  │      │  Email   │     │WhatsApp│   │
│ │Native│      │ Supabase │     │ Twilio │   │
│ └──────┘      └──────────┘     └────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## Summary Checklist

Before deploying as APK:

- [ ] All permissions declared in AndroidManifest.xml
- [ ] Foreground service Java files installed
- [ ] SOSServicePlugin registered in MainActivity
- [ ] Battery optimization guide communicated to users
- [ ] Test SMS sending on physical device
- [ ] Test shake detection with screen locked
- [ ] Test voice detection (limited background support)
