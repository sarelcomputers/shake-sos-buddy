import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    AndroidForegroundService?: {
      start: (options: {
        title: string;
        text: string;
        icon: string;
        priority: number;
      }) => Promise<void>;
      stop: () => Promise<void>;
      update: (options: {
        title: string;
        text: string;
      }) => Promise<void>;
    };
  }
}

export const startForegroundService = async (
  title: string = "Alfa22 SOS Active",
  text: string = "Monitoring for emergency triggers"
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    console.log('Foreground service only available on Android');
    return false;
  }

  try {
    if (window.AndroidForegroundService) {
      await window.AndroidForegroundService.start({
        title,
        text,
        icon: 'ic_notification',
        priority: 2, // HIGH priority
      });
      console.log('✅ Foreground service started');
      return true;
    } else {
      console.warn('AndroidForegroundService plugin not available');
      return false;
    }
  } catch (error) {
    console.error('Failed to start foreground service:', error);
    return false;
  }
};

export const stopForegroundService = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }

  try {
    if (window.AndroidForegroundService) {
      await window.AndroidForegroundService.stop();
      console.log('✅ Foreground service stopped');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to stop foreground service:', error);
    return false;
  }
};

export const updateForegroundService = async (
  title: string,
  text: string
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return false;
  }

  try {
    if (window.AndroidForegroundService) {
      await window.AndroidForegroundService.update({ title, text });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update foreground service:', error);
    return false;
  }
};
