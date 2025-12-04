// Foreground Service utilities for Android
// This manages the native foreground service for background SOS detection

import { Capacitor, registerPlugin } from '@capacitor/core';

interface SOSServicePlugin {
  startService(): Promise<{ started: boolean }>;
  stopService(): Promise<{ stopped: boolean }>;
  isRunning(): Promise<{ running: boolean }>;
}

// Register the native plugin (only works after native code is added)
let SOSService: SOSServicePlugin | null = null;

try {
  if (Capacitor.getPlatform() === 'android') {
    SOSService = registerPlugin<SOSServicePlugin>('SOSService');
  }
} catch (error) {
  console.log('SOSService plugin not available (native code not installed)');
}

/**
 * Start the Android foreground service for background SOS detection
 * This enables shake detection even when the screen is locked
 */
export async function startForegroundService(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') {
    console.log('Foreground service only available on Android');
    return false;
  }

  if (!SOSService) {
    console.warn('⚠️ SOSService plugin not available. Native code needs to be installed.');
    console.log('See docs/ANDROID_FOREGROUND_SERVICE.md for setup instructions');
    return false;
  }

  try {
    const result = await SOSService.startService();
    console.log('✅ Foreground service started:', result.started);
    return result.started;
  } catch (error) {
    console.error('❌ Failed to start foreground service:', error);
    return false;
  }
}

/**
 * Stop the Android foreground service
 */
export async function stopForegroundService(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') {
    return false;
  }

  if (!SOSService) {
    return false;
  }

  try {
    const result = await SOSService.stopService();
    console.log('✅ Foreground service stopped:', result.stopped);
    return result.stopped;
  } catch (error) {
    console.error('❌ Failed to stop foreground service:', error);
    return false;
  }
}

/**
 * Check if the foreground service is currently running
 */
export async function isForegroundServiceRunning(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') {
    return false;
  }

  if (!SOSService) {
    return false;
  }

  try {
    const result = await SOSService.isRunning();
    return result.running;
  } catch (error) {
    console.error('Error checking service status:', error);
    return false;
  }
}

/**
 * Check if foreground service is available (native code installed)
 */
export function isForegroundServiceAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && SOSService !== null;
}
