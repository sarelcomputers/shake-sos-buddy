# Android Foreground Service Setup

This guide explains how to set up a true Android foreground service for background voice and shake detection when the screen is locked, plus native SMS sending using your device's carrier.

## Overview

Android requires a foreground service with a persistent notification to perform long-running background tasks like:
- Continuous shake detection via accelerometer
- Voice detection via microphone
- Location tracking
- **Native SMS sending using device carrier (uses your SMS bundle)**

## Key Features

### Native SMS Sending
When converted to an APK, the app sends SMS messages **locally from your device** using the Android SMS API. This means:
- ✅ Uses your phone's SIM card and carrier
- ✅ Messages count against your SMS bundle/plan
- ✅ Works without internet connection
- ✅ More reliable than cloud-based SMS services
- ✅ Works even when screen is locked (with foreground service)

## Step 1: Update AndroidManifest.xml

After running `npx cap sync`, open `android/app/src/main/AndroidManifest.xml` and add these permissions and service declaration:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- SMS Permissions - CRITICAL for sending SMS from device -->
    <uses-permission android:name="android.permission.SEND_SMS" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    
    <!-- Foreground Service Permissions -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Audio/Voice Permissions -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Location Permissions -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    
    <!-- Battery Optimization -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    
    <application ...>
        
        <!-- Foreground Service for SOS Detection -->
        <service
            android:name=".SOSForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone|location">
        </service>
        
        <!-- Boot Receiver to restart service after reboot -->
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>
        
    </application>
</manifest>
```

## Step 2: Create SOSForegroundService.java

Create file: `android/app/src/main/java/app/lovable/[your-app-id]/SOSForegroundService.java`

```java
package app.lovable.5cb83c0c55a84b36a981495f8680a735;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class SOSForegroundService extends Service implements SensorEventListener {
    private static final String TAG = "SOSForegroundService";
    private static final String CHANNEL_ID = "sos_detection_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private PowerManager.WakeLock wakeLock;
    
    private long lastShakeTime = 0;
    private int shakeCount = 0;
    private float lastX, lastY, lastZ;
    private boolean isFirstReading = true;
    
    // Configurable settings
    private float shakeSensitivity = 2.5f;
    private int requiredShakes = 3;
    private long shakeTimeWindow = 2000; // 2 seconds
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        createNotificationChannel();
        loadSettings();
        
        // Acquire wake lock
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Alfa22SOS:ShakeDetectionWakeLock"
        );
        wakeLock.acquire();
        
        // Initialize accelerometer
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        
        // Start foreground with notification
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);
        
        // Register accelerometer listener
        if (accelerometer != null) {
            sensorManager.registerListener(
                this,
                accelerometer,
                SensorManager.SENSOR_DELAY_UI
            );
            Log.d(TAG, "Accelerometer listener registered");
        }
        
        return START_STICKY;
    }
    
    private void loadSettings() {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        
        String sensitivity = prefs.getString("shake_sensitivity", "medium");
        switch (sensitivity) {
            case "low":
                shakeSensitivity = 1.5f;
                break;
            case "high":
                shakeSensitivity = 3.5f;
                break;
            default:
                shakeSensitivity = 2.5f;
        }
        
        try {
            requiredShakes = Integer.parseInt(prefs.getString("required_shakes", "3"));
        } catch (NumberFormatException e) {
            requiredShakes = 3;
        }
        
        Log.d(TAG, "Settings loaded - Sensitivity: " + shakeSensitivity + ", Required shakes: " + requiredShakes);
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SOS Detection",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors for emergency shake gestures");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Alfa22 SOS Active")
            .setContentText("Monitoring for emergency shake gestures")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;
        
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        
        if (isFirstReading) {
            lastX = x;
            lastY = y;
            lastZ = z;
            isFirstReading = false;
            return;
        }
        
        float deltaX = Math.abs(x - lastX);
        float deltaY = Math.abs(y - lastY);
        float deltaZ = Math.abs(z - lastZ);
        
        // Detect shake
        if (deltaX > shakeSensitivity || deltaY > shakeSensitivity || deltaZ > shakeSensitivity) {
            long currentTime = System.currentTimeMillis();
            
            if (currentTime - lastShakeTime > shakeTimeWindow) {
                // Reset count if too much time passed
                shakeCount = 0;
            }
            
            shakeCount++;
            lastShakeTime = currentTime;
            
            Log.d(TAG, "Shake detected! Count: " + shakeCount + "/" + requiredShakes);
            
            if (shakeCount >= requiredShakes) {
                triggerSOS();
                shakeCount = 0;
            }
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not needed
    }
    
    private void triggerSOS() {
        Log.d(TAG, "SOS TRIGGERED!");
        
        // Store trigger flag for the web app to pick up
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        prefs.edit()
            .putString("background_sos_triggered", "true")
            .putString("background_sos_timestamp", String.valueOf(System.currentTimeMillis()))
            .apply();
        
        // Vibrate to indicate SOS
        android.os.Vibrator vibrator = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(500, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(500);
            }
        }
        
        // Launch app to foreground
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(launchIntent);
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
```

## Step 3: Create BootReceiver.java

Create file: `android/app/src/main/java/app/lovable/[your-app-id]/BootReceiver.java`

```java
package app.lovable.5cb83c0c55a84b36a981495f8680a735;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot completed, checking if SOS service should start");
            
            // Check if SOS was armed before reboot
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String isArmed = prefs.getString("sos_armed", "false");
            
            if ("true".equals(isArmed)) {
                Log.d(TAG, "SOS was armed, starting foreground service");
                Intent serviceIntent = new Intent(context, SOSForegroundService.class);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
```

## Step 4: Create Capacitor Plugin Bridge

Create file: `android/app/src/main/java/app/lovable/[your-app-id]/SOSServicePlugin.java`

```java
package app.lovable.5cb83c0c55a84b36a981495f8680a735;

import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SOSService")
public class SOSServicePlugin extends Plugin {
    
    @PluginMethod
    public void startService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), SOSForegroundService.class);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void stopService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), SOSForegroundService.class);
        getContext().stopService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void isRunning(PluginCall call) {
        // Check if service is running
        JSObject ret = new JSObject();
        ret.put("running", isServiceRunning());
        call.resolve(ret);
    }
    
    private boolean isServiceRunning() {
        android.app.ActivityManager manager = 
            (android.app.ActivityManager) getContext().getSystemService(android.content.Context.ACTIVITY_SERVICE);
        for (android.app.ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (SOSForegroundService.class.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}
```

## Step 5: Register Plugin in MainActivity

Edit `android/app/src/main/java/app/lovable/[your-app-id]/MainActivity.java`:

```java
package app.lovable.5cb83c0c55a84b36a981495f8680a735;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SOSServicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

## Usage in TypeScript

After setting up the native code, use the plugin in your app:

```typescript
import { Capacitor, registerPlugin } from '@capacitor/core';

interface SOSServicePlugin {
  startService(): Promise<{ started: boolean }>;
  stopService(): Promise<{ stopped: boolean }>;
  isRunning(): Promise<{ running: boolean }>;
}

const SOSService = registerPlugin<SOSServicePlugin>('SOSService');

// Start the service when arming SOS
async function armSOS() {
  if (Capacitor.getPlatform() === 'android') {
    await SOSService.startService();
    console.log('Foreground service started');
  }
}

// Stop the service when disarming
async function disarmSOS() {
  if (Capacitor.getPlatform() === 'android') {
    await SOSService.stopService();
    console.log('Foreground service stopped');
  }
}
```

## Battery Optimization

For the service to work reliably, users must disable battery optimization:

1. Go to **Settings** → **Apps** → **Alfa22 SOS**
2. Tap **Battery** → **Battery optimization**
3. Select **Don't optimize**

Or prompt programmatically using:
```java
Intent intent = new Intent();
intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
intent.setData(Uri.parse("package:" + getPackageName()));
startActivity(intent);
```

## Testing

1. Export project to GitHub
2. Run `git pull` and `npm install`
3. Run `npx cap sync android`
4. Open in Android Studio: `npx cap open android`
5. Copy the Java files to the correct package directory
6. Build and run on a physical device
7. Arm the SOS system and lock the screen
8. Shake the device - it should trigger SOS even when locked

## Troubleshooting

### Service stops after a while
- Ensure battery optimization is disabled
- Check if your device has aggressive battery management (Xiaomi, Samsung, etc.)
- Use [Don't Kill My App](https://dontkillmyapp.com/) for device-specific instructions

### Notification not showing
- Ensure POST_NOTIFICATIONS permission is granted (Android 13+)
- Check notification channel is created

### Shake not detected
- Verify accelerometer sensor is available
- Adjust sensitivity settings
- Test in debug mode to see sensor readings
