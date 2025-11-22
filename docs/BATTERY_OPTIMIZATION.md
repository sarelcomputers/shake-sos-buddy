# Android Battery Optimization Setup

## Overview
For the shake detection to work reliably in the background (even when the screen is locked), the app needs to be excluded from Android's battery optimization.

## Implementation Steps

### 1. Add Permission to AndroidManifest.xml
Add this permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### 2. Native Code Implementation (Optional)
To programmatically request battery optimization exemption, you can add this to your MainActivity or create a Capacitor plugin:

```java
import android.content.Intent;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;

// Check if battery optimization is enabled
PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
boolean isIgnoring = pm.isIgnoringBatteryOptimizations(getPackageName());

if (!isIgnoring) {
    // Request to disable battery optimization
    Intent intent = new Intent();
    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
    intent.setData(Uri.parse("package:" + getPackageName()));
    startActivity(intent);
}
```

### 3. User Instructions
When users enable the SOS system, guide them to:

1. Open **Settings** → **Apps** → **Alfa22 SOS**
2. Select **Battery** → **Battery optimization**
3. Change from "Optimize" to **"Don't optimize"**

OR

1. Open **Settings** → **Battery** → **Battery optimization**
2. Select **All apps** from the dropdown
3. Find **Alfa22 SOS** and set to **"Don't optimize"**

### 4. Testing
To verify battery optimization is disabled:

```java
PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
boolean isIgnoring = pm.isIgnoringBatteryOptimizations(getPackageName());
Log.d("BatteryOptimization", "Is ignoring battery optimization: " + isIgnoring);
```

## Why This Matters
Without disabling battery optimization:
- Android may kill the app when the screen is off
- Shake detection will stop working
- The KeepAwake plugin may not function reliably
- SOS alerts may not be triggered when needed

## Alternative Approaches
If you can't disable battery optimization system-wide, consider:
- Using Android Foreground Service with a persistent notification
- Implementing WorkManager for periodic checks
- Using Firebase Cloud Messaging for remote wake-up

## Platform Differences
- **Android**: Requires manual battery optimization exclusion
- **iOS**: No battery optimization - apps in background have limited CPU/sensor access but Active mode keeps sensors running
