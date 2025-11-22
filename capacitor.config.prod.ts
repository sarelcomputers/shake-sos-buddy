import type { CapacitorConfig } from '@capacitor/core';

// Production configuration for building APK/AAB
// Use this when building for app stores
const config: CapacitorConfig = {
  appId: 'app.lovable.5cb83c0c55a84b36a981495f8680a735',
  appName: 'Alfa22 SOS',
  webDir: 'dist',
  // NO server URL for production builds
  plugins: {
    KeepAwake: {
      enabled: true
    },
    SmsManager: {
      // No specific configuration needed
    },
    Geolocation: {
      // Request permissions at runtime
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;