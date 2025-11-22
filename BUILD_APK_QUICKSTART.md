# Quick Start: Build APK in 5 Minutes

## Prerequisites Checklist
- [ ] Android Studio installed (Otter/Koala/Ladybug/any version)
- [ ] Node.js v18+ installed
- [ ] Project exported to GitHub and cloned locally

## Quick Build Steps

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Configure for Production

**Edit `capacitor.config.ts` - Remove or comment out the `server` section:**

```typescript
const config: CapacitorConfig = {
  appId: 'app.lovable.5cb83c0c55a84b36a981495f8680a735',
  appName: 'Alfa22 SOS',
  webDir: 'dist',
  // Comment this out for production builds:
  // server: {
  //   url: 'https://...',
  //   cleartext: true
  // },
  plugins: {
    KeepAwake: { enabled: true },
    SmsManager: {}
  }
};
```

### 3. Add Android Platform (First Time Only)
```bash
npx cap add android
```

### 4. Build & Sync
```bash
npm run build
npx cap sync android
```

### 5. Open in Android Studio
```bash
npx cap open android
```

### 6. Build APK

In Android Studio:
1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Or use command line:**
```bash
cd android
./gradlew assembleDebug  # For testing
./gradlew assembleRelease  # For production (needs signing)
```

## For Google Play Store (AAB)
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

**Gradle sync failed?**
```bash
cd android
./gradlew clean
cd ..
npm run build
npx cap sync android
```

**White screen on app?**
- Make sure you ran `npm run build` before `npx cap sync`
- Check capacitor.config.ts has `webDir: 'dist'`

**Plugins not working?**
```bash
npx cap sync android
```

## Version Updates

Before each new build, update in `android/app/build.gradle`:
```gradle
versionCode 2  // Increment by 1
versionName "1.0.1"  // Your version number
```

## That's It!

See **ANDROID_BUILD_GUIDE.md** for detailed instructions including:
- App signing for release builds
- Google Play Store submission
- Advanced configurations
- Common issues and solutions

## Android Studio Compatibility

✅ Your app is compatible with:
- Android Studio Otter
- Android Studio Koala  
- Android Studio Ladybug
- Android Studio Hedgehog
- All recent versions

**Gradle Version**: 8.7 (auto-configured)  
**Min Android**: 5.1 (API 22)  
**Target Android**: 14 (API 34)
