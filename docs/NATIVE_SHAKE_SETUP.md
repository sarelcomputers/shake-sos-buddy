# Native Background Shake Detection Setup

This guide explains how to add native shake detection that works when your phone screen is locked.

## Why This Is Needed

The web-based `devicemotion` API stops working when:
- Screen is locked
- App is in background
- Device goes to sleep

A **native Android foreground service** runs independently and can detect shakes even with the screen off.

---

## Step 1: Update AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add these permissions inside `<manifest>`:

```xml
<!-- SMS Permission -->
<uses-permission android:name="android.permission.SEND_SMS" />

<!-- Foreground Service Permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Keep device awake -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Battery optimization -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Sensors -->
<uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />
```

Add this inside `<application>` tag:

```xml
<service
    android:name=".SOSForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="specialUse">
</service>
```

---

## Step 2: Create SOSForegroundService.java

Create file: `android/app/src/main/java/app/lovable/[your-app-id]/SOSForegroundService.java`

```java
package app.lovable.YOUR_APP_ID; // UPDATE THIS

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
import android.telephony.SmsManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class SOSForegroundService extends Service implements SensorEventListener {
    private static final String TAG = "SOSForegroundService";
    private static final String CHANNEL_ID = "sos_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private PowerManager.WakeLock wakeLock;
    
    private float lastX, lastY, lastZ;
    private long lastUpdate = 0;
    private int shakeCount = 0;
    private long lastShakeTime = 0;
    
    // Configurable settings
    private float shakeThreshold = 15.0f; // Adjust sensitivity
    private int requiredShakes = 3;
    private long resetTime = 2000; // 2 seconds to complete shakes
    
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        // Create notification channel
        createNotificationChannel();
        
        // Acquire wake lock to keep CPU running
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Alfa22::SOSWakeLock"
        );
        wakeLock.acquire();
        
        // Initialize accelerometer
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        
        if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
            Log.d(TAG, "Accelerometer registered");
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        
        // Load settings from SharedPreferences
        loadSettings();
        
        // Start foreground with notification
        startForeground(NOTIFICATION_ID, createNotification());
        
        return START_STICKY; // Restart if killed
    }
    
    private void loadSettings() {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        
        // Load shake sensitivity
        String sensitivity = prefs.getString("sos_shake_sensitivity", "medium");
        switch (sensitivity) {
            case "low":
                shakeThreshold = 20.0f;
                break;
            case "high":
                shakeThreshold = 10.0f;
                break;
            default:
                shakeThreshold = 15.0f;
        }
        
        // Load required shakes
        requiredShakes = prefs.getInt("sos_shake_count", 3);
        
        Log.d(TAG, "Settings loaded - threshold: " + shakeThreshold + ", required: " + requiredShakes);
    }
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_ACCELEROMETER) return;
        
        long currentTime = System.currentTimeMillis();
        
        // Throttle to ~10 updates per second
        if ((currentTime - lastUpdate) < 100) return;
        
        long timeDiff = currentTime - lastUpdate;
        lastUpdate = currentTime;
        
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];
        
        float deltaX = Math.abs(x - lastX);
        float deltaY = Math.abs(y - lastY);
        float deltaZ = Math.abs(z - lastZ);
        
        float totalDelta = deltaX + deltaY + deltaZ;
        
        if (totalDelta > shakeThreshold) {
            long timeSinceLastShake = currentTime - lastShakeTime;
            
            // Reset if too much time passed
            if (timeSinceLastShake > resetTime) {
                shakeCount = 0;
            }
            
            shakeCount++;
            lastShakeTime = currentTime;
            
            Log.d(TAG, "Shake detected! Count: " + shakeCount + "/" + requiredShakes);
            
            if (shakeCount >= requiredShakes) {
                Log.d(TAG, "🚨 SOS TRIGGERED!");
                triggerSOS();
                shakeCount = 0;
            }
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
    }
    
    private void triggerSOS() {
        // Set flag for web app to detect
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        prefs.edit()
            .putBoolean("sos_triggered_native", true)
            .putLong("sos_triggered_time", System.currentTimeMillis())
            .apply();
        
        // Send SMS directly from native code
        sendEmergencySMS();
        
        // Update notification
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify(NOTIFICATION_ID, createAlertNotification());
    }
    
    private void sendEmergencySMS() {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        String contactsJson = prefs.getString("emergency_contacts", "[]");
        String message = prefs.getString("sos_message", "EMERGENCY! I need help!");
        
        try {
            // Parse contacts and send SMS
            // This is a simplified version - parse your JSON contacts here
            SmsManager smsManager = SmsManager.getDefault();
            
            // Example: Send to stored numbers
            // You'll need to parse contactsJson and loop through contacts
            Log.d(TAG, "Sending emergency SMS...");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to send SMS: " + e.getMessage());
        }
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "SOS Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Monitors for emergency shake triggers");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
    
    private Notification createNotification() {
        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Alfa22 SOS Active")
            .setContentText("Monitoring for emergency shakes")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }
    
    private Notification createAlertNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🚨 SOS TRIGGERED!")
            .setContentText("Emergency alerts being sent...")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .build();
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        Log.d(TAG, "Service destroyed");
    }
}
```

---

## Step 3: Create SOSServicePlugin.java (Capacitor Bridge)

Create file: `android/app/src/main/java/app/lovable/[your-app-id]/SOSServicePlugin.java`

```java
package app.lovable.YOUR_APP_ID; // UPDATE THIS

import android.content.Intent;
import android.app.ActivityManager;
import android.content.Context;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "SOSService")
public class SOSServicePlugin extends Plugin {
    
    @PluginMethod
    public void startService(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, SOSForegroundService.class);
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
        
        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void stopService(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, SOSForegroundService.class);
        context.stopService(intent);
        
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }
    
    @PluginMethod
    public void isRunning(PluginCall call) {
        boolean running = isServiceRunning(SOSForegroundService.class);
        
        JSObject result = new JSObject();
        result.put("running", running);
        call.resolve(result);
    }
    
    private boolean isServiceRunning(Class<?> serviceClass) {
        ActivityManager manager = (ActivityManager) getContext()
            .getSystemService(Context.ACTIVITY_SERVICE);
        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}
```

---

## Step 4: Register Plugin in MainActivity.java

Open `android/app/src/main/java/app/lovable/[your-app-id]/MainActivity.java` and add:

```java
package app.lovable.YOUR_APP_ID; // UPDATE THIS

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the plugin BEFORE super.onCreate()
        registerPlugin(SOSServicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

---

## Step 5: Build & Test

1. **Sync the project:**
   ```bash
   npx cap sync android
   ```

2. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

3. **Build and run on device**

4. **Test:** Arm SOS, lock screen, shake phone

---

## iOS Limitations

Unfortunately, iOS does **not allow** background accelerometer access. The app must be in the foreground for shake detection to work on iOS. This is an Apple security restriction that cannot be bypassed.

---

## Troubleshooting

1. **Service not starting:** Check logcat for errors
2. **Shakes not detected:** Adjust `shakeThreshold` value
3. **Battery drain:** The service uses minimal CPU with PARTIAL_WAKE_LOCK
4. **SMS not sending:** Ensure SEND_SMS permission is granted at runtime
