import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { supabase } from '@/integrations/supabase/client';

export const sendSOSMessages = async (message: string, contacts: Array<{ phone: string; name: string }>) => {
  try {
    // Get current location
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { latitude, longitude } = position.coords;

    console.log('Sending SOS via backend to', contacts.length, 'contacts');

    // Send SMS via backend edge function
    const { data, error } = await supabase.functions.invoke('send-sos-sms', {
      body: {
        message,
        contacts,
        location: { latitude, longitude }
      }
    });

    if (error) {
      console.error('Failed to send SOS via backend:', error);
      await Haptics.notification({ type: NotificationType.Error });
      throw error;
    }

    console.log('SOS messages sent successfully:', data);
    
    // Trigger success haptic
    await Haptics.notification({ type: NotificationType.Success });

    return true;
  } catch (error) {
    console.error('Failed to send SOS:', error);
    await Haptics.notification({ type: NotificationType.Error });
    throw error;
  }
};
