// SMS Permission utilities for Android
import { Capacitor } from '@capacitor/core';

/**
 * Request SMS permission on Android
 * Returns true if permission is granted or not needed (iOS/web)
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web doesn't need SMS permission
    return true;
  }

  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    // iOS uses system SMS app, no permission needed
    return true;
  }

  if (platform === 'android') {
    // The @byteowls/capacitor-sms plugin handles permissions internally
    // when calling send(). It will prompt the user if needed.
    console.log('📱 SMS permission will be requested when sending');
    return true;
  }

  return true;
}

/**
 * Check if device can send SMS
 */
export function canSendSms(): boolean {
  if (!Capacitor.isNativePlatform()) {
    // Web cannot send SMS natively
    return false;
  }
  
  // Native platforms (Android/iOS) can send SMS
  return true;
}
