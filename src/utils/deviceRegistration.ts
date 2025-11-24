import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';

export const getDeviceId = async (): Promise<string> => {
  try {
    const info = await Device.getId();
    return info.identifier;
  } catch (error) {
    console.error('Failed to get device ID:', error);
    // Fallback to browser fingerprint for web
    return 'web-' + navigator.userAgent;
  }
};

export const isDeviceRegistered = async (deviceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('device_registrations')
      .select('id')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Error checking device registration:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Failed to check device registration:', error);
    return false;
  }
};

export const registerDevice = async (userId: string, deviceId: string): Promise<void> => {
  try {
    const deviceInfo = await Device.getInfo();
    
    const { error } = await supabase
      .from('device_registrations')
      .insert({
        user_id: userId,
        device_id: deviceId,
        device_model: `${deviceInfo.manufacturer} ${deviceInfo.model}`,
      });

    if (error) {
      console.error('Error registering device:', error);
    }
  } catch (error) {
    console.error('Failed to register device:', error);
  }
};
