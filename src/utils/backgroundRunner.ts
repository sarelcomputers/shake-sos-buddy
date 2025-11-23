import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

/**
 * Store motion data for background runner access
 * This is called by the main app when device motion is detected
 */
export const storeMotionData = async (x: number, y: number, z: number) => {
  try {
    if (!Capacitor.isNativePlatform()) return;
    
    await Preferences.set({
      key: 'last_motion_data',
      value: JSON.stringify({ x, y, z, timestamp: Date.now() }),
    });
  } catch (error) {
    console.error('Error storing motion data:', error);
  }
};

/**
 * Check if background runner has triggered an SOS
 * This is called by the main app to check if the background runner
 * has detected shakes and needs to trigger an SOS
 */
export const checkBackgroundSOSTrigger = async (): Promise<boolean> => {
  try {
    if (!Capacitor.isNativePlatform()) return false;
    
    const { value } = await Preferences.get({ key: 'trigger_sos' });
    
    if (value === 'true') {
      // Clear the trigger flag
      await Preferences.set({
        key: 'trigger_sos',
        value: 'false',
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking background SOS trigger:', error);
    return false;
  }
};

/**
 * Clear all background runner settings
 */
export const clearBackgroundSettings = async () => {
  try {
    await Preferences.remove({ key: 'sos_armed' });
    await Preferences.remove({ key: 'shake_sensitivity' });
    await Preferences.remove({ key: 'required_shakes' });
    await Preferences.remove({ key: 'last_motion_data' });
    await Preferences.remove({ key: 'trigger_sos' });
  } catch (error) {
    console.error('Error clearing background settings:', error);
  }
};
