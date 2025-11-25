import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

declare global {
  interface Window {
    AndroidBatteryOptimization?: {
      requestDisable: () => Promise<{ disabled: boolean }>;
      isDisabled: () => Promise<{ disabled: boolean }>;
    };
  }
}

export interface PermissionStatus {
  location: boolean;
  microphone: boolean;
  batteryOptimization: boolean;
  notification: boolean;
}

export const requestLocationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Location permissions only needed on native platforms');
    return true;
  }

  try {
    // Request location permission (this includes background location on Android 10+)
    const permission = await Geolocation.requestPermissions();
    
    if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
      console.log('✅ Location permissions granted');
      return true;
    } else {
      console.warn('⚠️ Location permissions denied');
      return false;
    }
  } catch (error) {
    console.error('Failed to request location permissions:', error);
    return false;
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Microphone permission granted');
    return true;
  } catch (error) {
    console.error('Failed to request microphone permission:', error);
    return false;
  }
};

export const requestBatteryOptimizationExemption = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return true;
  }

  try {
    if (window.AndroidBatteryOptimization) {
      const result = await window.AndroidBatteryOptimization.requestDisable();
      if (result.disabled) {
        console.log('✅ Battery optimization disabled');
        return true;
      } else {
        console.warn('⚠️ Battery optimization exemption denied');
        return false;
      }
    } else {
      console.warn('AndroidBatteryOptimization plugin not available');
      return false;
    }
  } catch (error) {
    console.error('Failed to request battery optimization exemption:', error);
    return false;
  }
};

export const isBatteryOptimizationDisabled = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return true;
  }

  try {
    if (window.AndroidBatteryOptimization) {
      const result = await window.AndroidBatteryOptimization.isDisabled();
      return result.disabled;
    }
    return false;
  } catch (error) {
    console.error('Failed to check battery optimization status:', error);
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.warn('⚠️ Notification permission denied');
        return false;
      }
    }
    return true; // Assume granted if API not available
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

export const requestAllBackgroundPermissions = async (): Promise<PermissionStatus> => {
  console.log('🔐 Requesting all background permissions...');
  
  const [location, microphone, notification] = await Promise.all([
    requestLocationPermissions(),
    requestMicrophonePermission(),
    requestNotificationPermission(),
  ]);

  const batteryOptimization = await requestBatteryOptimizationExemption();

  const status: PermissionStatus = {
    location,
    microphone,
    batteryOptimization,
    notification,
  };

  console.log('Permission status:', status);
  return status;
};
