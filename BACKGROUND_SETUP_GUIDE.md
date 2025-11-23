# Background Shake Detection Setup Guide

This app now supports **true background shake detection** that works even when the app is closed or the device is locked.

## How It Works

The app uses Capacitor's Background Runner plugin to monitor device motion in the background. When armed, it will:
- ✅ Continue listening for shakes when the app is minimized
- ✅ Work when the device screen is locked
- ✅ Trigger SOS alerts even if the app is not in the foreground
- ✅ Keep running in the background (with OS limitations)

## Platform-Specific Setup

### Android Setup (Required)

1. **Add Permissions to AndroidManifest.xml**
   
   After running `npx cap sync`, open `android/app/src/main/AndroidManifest.xml` and add:

   ```xml
   <!-- Add inside <manifest> tag, before <application> -->
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
   
   <!-- Add inside <application> tag -->
   <service
       android:name="com.getcapacitor.plugin.backgroundrunner.BackgroundRunnerService"
       android:enabled="true"
       android:exported="true"
       android:foregroundServiceType="specialUse">
   </service>
   ```

2. **Disable Battery Optimization**
   
   Users must disable battery optimization for the app:
   - Settings → Apps → Alfa22 SOS → Battery → Unrestricted

3. **Grant Notification Permission**
   
   Required for background alerts to work properly.

### iOS Setup (Limitations)

⚠️ **iOS has strict background execution limits:**
- Background tasks are limited to 30 seconds
- True background monitoring is not allowed for motion sensors
- The app uses KeepAwake to stay active when screen is locked (not fully closed)

**For iOS:**
1. The app will stay awake when locked IF it's in the foreground
2. Users should keep the app open when armed
3. Background Runner has limited functionality on iOS due to Apple restrictions

## Testing Background Mode

### Android
1. Arm the SOS system in the app
2. Press the home button (don't swipe up to close)
3. Lock your device
4. Shake the device vigorously
5. The SOS alert should trigger

### iOS
1. Arm the SOS system
2. Keep the app open (in foreground)
3. Lock the device (screen off)
4. Shake the device
5. The SOS alert should trigger (app must remain in foreground)

## Building for Production

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:
- Build → Generate Signed Bundle / APK
- Follow Android signing guide

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
- Configure signing & capabilities
- Enable Background Modes: Background fetch, Background processing
- Build for device

## Important Notes

1. **Battery Usage**: Background monitoring will increase battery consumption
2. **OS Restrictions**: Both Android and iOS may limit background execution to save battery
3. **User Must Allow**: Users must grant all permissions and disable battery optimization
4. **Testing**: Always test on physical devices, not emulators
5. **Wake Lock**: The app keeps the device awake when armed, which is battery-intensive

## Troubleshooting

**Background runner not working:**
- Ensure all permissions are granted
- Disable battery optimization for the app
- Check that the app is armed before testing
- View logs: `npx cap run android -l` or Xcode console

**SOS not triggering in background:**
- Verify shake sensitivity settings (lower = more sensitive)
- Check that notification permissions are granted
- Ensure the device has good accelerometer calibration

## Additional Configuration

You can adjust background runner settings in `capacitor.config.ts`:
- `interval`: How often to check (in minutes)
- `autoStart`: Whether to start automatically (currently false)

For more information, see: https://capacitorjs.com/docs/apis/background-runner
