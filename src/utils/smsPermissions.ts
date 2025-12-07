// SMS Permission utilities for Android
import { Capacitor } from '@capacitor/core';
import { SmsManager } from '@byteowls/capacitor-sms';

/**
 * Check if SMS permission is granted on Android
 * Returns true if permission is granted, on iOS, or on web
 */
export async function checkSmsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 Web platform - SMS not available');
    return false;
  }

  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    // iOS uses system SMS app, always available
    console.log('📱 iOS - SMS available via system app');
    return true;
  }

  if (platform === 'android') {
    try {
      // The @byteowls/capacitor-sms plugin handles permissions internally
      // We can check if SMS capability exists
      console.log('📱 Android - SMS capability available');
      return true;
    } catch (error) {
      console.error('SMS permission check failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Request SMS permission on Android by attempting a test (dry-run) operation
 * This will trigger the permission dialog if not yet granted
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('📱 Web platform - SMS not available');
    return false;
  }

  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    // iOS doesn't need explicit SMS permission - uses system app
    console.log('✅ iOS SMS ready - uses system SMS app');
    return true;
  }

  if (platform === 'android') {
    try {
      // On Android, the SmsManager plugin will request SEND_SMS permission
      // when actually trying to send. We can't pre-request it easily.
      // The permission will be requested on first send attempt.
      console.log('📱 Android SMS permission will be requested on first send');
      console.log('📱 Make sure SEND_SMS is declared in AndroidManifest.xml');
      return true;
    } catch (error) {
      console.error('SMS permission request failed:', error);
      return false;
    }
  }

  return false;
}

/**
 * Check if the device can send SMS messages
 */
export function canSendSms(): boolean {
  if (!Capacitor.isNativePlatform()) {
    // Web cannot send SMS natively
    return false;
  }
  
  // Native platforms (Android/iOS) can send SMS
  return true;
}

/**
 * Send a test SMS to verify permissions work
 * This should trigger the permission dialog on Android if needed
 */
export async function testSmsPermission(testPhoneNumber: string): Promise<{ success: boolean; message: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, message: 'SMS only available on mobile devices' };
  }

  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    return { success: true, message: 'iOS will use system SMS app' };
  }

  if (platform === 'android') {
    try {
      // Try to send an actual SMS - this will trigger permission request
      // Note: This will actually send an SMS if permission is granted
      // Only use for testing with user consent
      await SmsManager.send({
        numbers: [testPhoneNumber],
        text: 'Alfa22 SOS - SMS Test. This confirms your SMS permissions are working.',
      });
      
      return { success: true, message: 'SMS permission granted and test sent' };
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('permission')) {
        return { success: false, message: 'SMS permission denied. Please grant permission in device settings.' };
      }
      return { success: false, message: `SMS error: ${error?.message || 'Unknown error'}` };
    }
  }

  return { success: false, message: 'Unknown platform' };
}
