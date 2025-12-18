import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
//  appId: 'app.lovable.5cb83c0c55a84b36a981495f8680a735',
//  appName: 'Alfa22 SOS',
//  webDir: 'dist'
      plugins: {
    KeepAwake: {
      enabled: true
        SmsManager: {
      // No specific configuration needed for basic SMS sending
    },
    BackgroundRunner: {
      label: 'app.lovable.shake.sos.background',
      src: 'runners/background.js',
      event: 'shakeDetection',
      repeat: true,
      interval: 1, // Check every 1 minute
      autoStart: false // Only start when user arms the system
    }
  },
  // Android-specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Background execution settings
    backgroundMode: {
      enabled: true,
      description: 'Enables SOS monitoring with location tracking, voice detection, and shake detection even when screen is locked or app is minimized'
    }
  }
};

export default config;
