# Android Studio Build Guide for Alfa22 SOS

This guide will help you build your APK using Android Studio (Otter, Koala, Ladybug, or any recent version).

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher): https://nodejs.org/
2. **Android Studio** (Latest version): https://developer.android.com/studio
3. **JDK 17** (comes with Android Studio or download separately)
4. **Git**: https://git-scm.com/

### Android Studio Components
Open Android Studio → Tools → SDK Manager and install:
- ✅ Android SDK Platform 34 (or latest)
- ✅ Android SDK Build-Tools 34 (or latest)
- ✅ Android SDK Command-line Tools
- ✅ Android SDK Platform-Tools
- ✅ Android Emulator (optional, for testing)

## Step-by-Step Build Process

### Step 1: Export and Clone Your Project

1. In Lovable, click the **GitHub icon** in the top right
2. Click "Export to GitHub" and create a new repository
3. Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Step 2: Install Dependencies

```bash
# Install npm packages
npm install

# Install Capacitor CLI globally (optional but recommended)
npm install -g @capacitor/cli
```

### Step 3: Configure for Production Build

Before building for Android, you need to remove the development server URL from the Capacitor config:

**Edit `capacitor.config.ts`:**

```typescript
import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.5cb83c0c55a84b36a981495f8680a735',
  appName: 'Alfa22 SOS',
  webDir: 'dist',
  // REMOVE or comment out the server section for production:
  // server: {
  //   url: 'https://5cb83c0c-55a8-4b36-a981-495f8680a735.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    KeepAwake: {
      enabled: true
    },
    SmsManager: {}
  }
};

export default config;
```

**Important:** The `server.url` should only be used during development for hot-reload. Remove it before building production APKs.

### Step 4: Add Android Platform

```bash
# Add Android platform
npx cap add android
```

This creates the `android/` directory with all Android project files.

### Step 5: Build the Web Assets

```bash
# Build the production web bundle
npm run build
```

This creates the `dist/` directory with optimized production files.

### Step 6: Sync to Android

```bash
# Sync web assets and plugins to Android
npx cap sync android
```

This copies your web app to the Android project and configures native plugins.

### Step 7: Open in Android Studio

```bash
# Open Android project in Android Studio
npx cap open android
```

Or manually open Android Studio and select: **File → Open** → Navigate to `android/` folder

### Step 8: Configure Android Project

Once Android Studio opens:

#### 8.1 Check Gradle Sync
- Android Studio will automatically sync Gradle
- Wait for "Gradle sync finished" notification
- If errors occur, click "Sync Project with Gradle Files" in toolbar

#### 8.2 Set Build Variant
- Click **Build → Select Build Variant**
- Choose **release** (for production APK) or **debug** (for testing)

#### 8.3 Configure App Signing (for Release APK)

**Generate Keystore:**
```bash
# In your project root
keytool -genkey -v -keystore alfa22-sos-release.keystore -alias alfa22-sos -keyalg RSA -keysize 2048 -validity 10000
```

Enter a strong password and fill in the required information.

**Update `android/app/build.gradle`:**

Add before `android { }` block:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { }` block, add:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**Create `android/keystore.properties`:**

```properties
storeFile=../alfa22-sos-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=alfa22-sos
keyPassword=YOUR_KEY_PASSWORD
```

**IMPORTANT:** Add `keystore.properties` to `.gitignore` to keep passwords secure!

### Step 9: Build APK

#### Option A: Build from Android Studio GUI

1. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click "locate" in the notification to find your APK
4. APK location: `android/app/build/outputs/apk/release/app-release.apk`

#### Option B: Build from Command Line

```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# Build debug APK (for testing)
./gradlew assembleDebug

# APK will be in: app/build/outputs/apk/release/app-release.apk
```

### Step 10: Build App Bundle (for Google Play)

For Google Play Store submission, you need an AAB (Android App Bundle):

```bash
cd android
./gradlew bundleRelease
```

AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

## Common Issues and Solutions

### Issue 1: Gradle Sync Failed

**Solution:**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew build
```

### Issue 2: JDK Version Mismatch

Android Studio Otter/Koala requires JDK 17.

**Check JDK version:**
```bash
java -version
```

**Set JDK in Android Studio:**
- File → Project Structure → SDK Location → JDK location
- Select JDK 17 (comes with Android Studio)

### Issue 3: Plugin Not Found

**Solution:**
```bash
# Make sure all plugins are synced
npm install
npx cap sync android
```

### Issue 4: Build Failed - Missing Permissions

Make sure `android/app/src/main/AndroidManifest.xml` contains:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Issue 5: White Screen on App Launch

**Solution:**
1. Make sure you ran `npm run build` before `npx cap sync`
2. Check that `webDir: 'dist'` in capacitor.config.ts matches your build output
3. Clear app data and reinstall

### Issue 6: Native Plugins Not Working

**Solution:**
```bash
# Update native dependencies
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Testing Your APK

### Install on Physical Device

```bash
# Enable USB debugging on your Android device
# Connect device via USB
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Install on Emulator

1. Open Android Studio → AVD Manager
2. Create/Start an emulator
3. Drag and drop APK onto emulator window

## Build Optimization

### Reduce APK Size

**In `android/app/build.gradle`, add:**

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    // Enable ABI splits
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

## Version Management

### Update Version Code and Name

**Edit `android/app/build.gradle`:**

```gradle
android {
    defaultConfig {
        versionCode 2  // Increment for each Play Store release
        versionName "1.1.0"  // User-facing version
    }
}
```

**Also update `package.json`:**
```json
{
  "version": "1.1.0"
}
```

## Production Checklist

Before building for Google Play:

- [ ] Remove `server.url` from capacitor.config.ts
- [ ] Run `npm run build` to create production bundle
- [ ] Update version code and version name
- [ ] Set up keystore for app signing
- [ ] Test on multiple Android versions
- [ ] Check all permissions are needed
- [ ] Test on different screen sizes
- [ ] Verify SMS and location features work
- [ ] Test shake detection thoroughly
- [ ] Check payment flow with PayFast
- [ ] Verify Privacy Policy and Terms links work
- [ ] Test with and without internet connection

## Gradle Configuration

Your app uses these Gradle versions (automatically configured):
- **Gradle**: 8.7 (via wrapper)
- **Android Gradle Plugin**: 8.7.0
- **Compile SDK**: 34
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

These are compatible with Android Studio Otter, Koala, and Ladybug.

## Performance Tips

1. **Enable R8 (Code Shrinking):** Already enabled in release builds
2. **Use ProGuard Rules:** Add custom rules in `android/app/proguard-rules.pro`
3. **Optimize Images:** Use WebP format and compress assets
4. **Lazy Load:** Heavy components loaded on demand
5. **Bundle Size:** Use App Bundle (AAB) instead of APK for Play Store

## Continuous Integration (Optional)

For automated builds, you can use:
- **GitHub Actions**: `.github/workflows/android.yml`
- **Bitrise**: https://bitrise.io
- **Codemagic**: https://codemagic.io

## Need Help?

- **Capacitor Docs**: https://capacitorjs.com/docs/android
- **Android Developer Guide**: https://developer.android.com/guide
- **Stack Overflow**: Tag questions with `capacitor` and `android`

## Quick Reference Commands

```bash
# Full build sequence
npm install
npm run build
npx cap sync android
npx cap open android

# Clean build
cd android && ./gradlew clean && cd ..
npm run build
npx cap sync android

# Build APK
cd android && ./gradlew assembleRelease

# Build AAB for Play Store
cd android && ./gradlew bundleRelease

# Update plugins
npx cap sync android

# Run on device
npx cap run android
```

Good luck with your build! 🚀
