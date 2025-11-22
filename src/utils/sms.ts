import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { SmsManager } from '@byteowls/capacitor-sms';
import { supabase } from '@/integrations/supabase/client';

export const sendSOSMessages = async (
  message: string, 
  contacts: Array<{ phone: string; name: string }>,
  userId?: string
) => {
  try {
    // Get current location
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { latitude, longitude } = position.coords;

    console.log('Sending SOS via device SMS to', contacts.length, 'contacts');

    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const fullMessage = `${message}\n\nLocation: ${locationUrl}`;

    // Send SMS silently using device's native SMS capabilities
    try {
      const phoneNumbers = contacts.map(c => c.phone);
      
      await SmsManager.send({
        numbers: phoneNumbers,
        text: fullMessage,
      });
      
      console.log(`SMS sent silently to ${contacts.length} contacts`);
    } catch (error) {
      console.error('Failed to send SMS silently:', error);
      await Haptics.notification({ type: NotificationType.Error });
      throw error;
    }

    // Log to history if user is authenticated
    if (userId) {
      try {
        await supabase.from('sos_history').insert({
          user_id: userId,
          message,
          latitude,
          longitude,
          contacts_count: contacts.length,
          contacted_recipients: contacts.map(c => ({ name: c.name, phone: c.phone }))
        });
      } catch (historyError) {
        console.error('Failed to log SOS history:', historyError);
        // Don't fail the whole operation if logging fails
      }
    }

    console.log('SOS messages sent successfully via device SMS');
    
    // Trigger success haptic
    await Haptics.notification({ type: NotificationType.Success });

    return true;
  } catch (error) {
    console.error('Failed to send SOS:', error);
    await Haptics.notification({ type: NotificationType.Error });
    throw error;
  }
};
