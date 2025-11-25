# Android Background Permissions Setup

## Overview
This guide covers the setup needed for the SOS app to run location tracking, voice detection, and shake detection in the background, even when the screen is locked or the app is minimized.

## Required Permissions

After running `npx cap sync`, you need to manually add these permissions to `android/app/src/main/AndroidManifest.xml`:

### 1. Add Permissions (inside `<manifest>` tag, before `<application>`):

```xml
<!-- Location Permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Foreground Service Permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

<!-- Audio Recording -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Wake Lock for keeping device awake -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Battery Optimization -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Sensors for shake detection -->
<uses-permission android:name="android.permission.BODY_SENSORS" />
```

### 2. Add Foreground Service Declaration (inside `<application>` tag):

```xml
<service
    android:name=".SOSForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="location|microphone">
</service>
```

## Battery Optimization Exclusion

### Method 1: Programmatic Request (Recommended)
The app will automatically prompt users to disable battery optimization when they enable the SOS system.

### Method 2: Manual Setup
Guide users to:
1. Open **Settings** → **Apps** → **Alfa22 SOS**
2. Select **Battery** → **Battery optimization**
3. Change from "Optimize" to **"Don't optimize"**

## Runtime Permissions

The app will request these permissions at runtime when needed:
- Location (Fine & Background)
- Microphone
- Notifications
- Battery optimization exclusion

## Foreground Service Implementation

### Create SOSForegroundService.java

Create `android/app/src/main/java/app/lovable/[your-app-id]/SOSForegroundService.java`:

```java
package app.lovable.app.lovable.5cb83c0c55a84b36a981495f8680a735;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class SOSForegroundService extends Service {
    private static final String CHANNEL_ID = "SOS_MONITORING_CHANNEL";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SOS System Active")
            .setContentText("Monitoring for emergency alerts")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build();

        startForeground(NOTIFICATION_ID, notification);
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SOS Monitoring",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Keeps SOS system active in background");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopForeground(true);
    }
}
```

## Starting the Foreground Service

### Update MainActivity.java

Add this method to `android/app/src/main/java/app/lovable/[your-app-id]/MainActivity.java`:

```java
import android.content.Intent;
import android.os.Build;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onResume() {
        super.onResume();
        // Start foreground service when app is active
        startSOSForegroundService();
    }

    private void startSOSForegroundService() {
        Intent serviceIntent = new Intent(this, SOSForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
```

## Testing Background Functionality

### Location Tracking
1. Enable the SOS system
2. Lock the screen or minimize the app
3. Move to a different location
4. Trigger an SOS alert
5. Verify location is accurate in the alert

### Voice Detection
1. Enable voice alerts and set a password
2. Enable the SOS system
3. Lock the screen
4. Speak the password clearly
5. Verify the alert is triggered

### Shake Detection
1. Enable the SOS system
2. Lock the screen or minimize the app
3. Shake the device with the configured intensity
4. Verify the alert is triggered

## Troubleshooting

### Location Not Updating in Background
- Verify battery optimization is disabled
- Check that ACCESS_BACKGROUND_LOCATION permission is granted
- Ensure foreground service is running (check notification)

### Voice Detection Not Working When Locked
- Verify RECORD_AUDIO permission is granted
- Check that WAKE_LOCK permission is granted
- Ensure microphone access in background is allowed

### Shake Detection Not Working
- Verify battery optimization is disabled
- Check that the app is not being force-stopped by the system
- Ensure KeepAwake plugin is active

### App Killed by System
- Disable battery optimization
- Add app to "Protected apps" or "Auto-start" list (varies by manufacturer)
- Keep foreground service notification visible

## Platform-Specific Considerations

### Samsung Devices
- Go to Settings → Apps → Alfa22 SOS → Battery → Optimize battery usage → All → Alfa22 SOS → Don't optimize
- Add to "Sleeping apps" exclusion list

### Huawei Devices
- Enable "Protected apps" for Alfa22 SOS
- Disable "Close apps after screen lock"

### Xiaomi Devices
- Enable "Autostart" for Alfa22 SOS
- Disable "Battery saver" restrictions for the app

## Build Steps

After making these changes:

1. Run `npm run build`
2. Run `npx cap sync android`
3. Open Android Studio: `npx cap open android`
4. Add the permissions and service to AndroidManifest.xml
5. Create SOSForegroundService.java
6. Update MainActivity.java
7. Build and test on a physical device

## Important Notes

- **Physical Device Required**: Background functionality must be tested on a physical device, not an emulator
- **User Permission**: Users must manually grant background location access and disable battery optimization
- **Persistent Notification**: The foreground service notification cannot be dismissed and must remain visible
- **Battery Impact**: Continuous background monitoring will impact battery life
- **Android 12+**: Foreground services with location/microphone types have stricter requirements
