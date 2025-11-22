import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
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

    // Send SMS using device's native SMS app
    if (Capacitor.isNativePlatform()) {
      // On native platforms, open SMS app for each contact
      for (const contact of contacts) {
        const separator = Capacitor.getPlatform() === 'ios' ? '&' : '?';
        const smsUrl = `sms:${contact.phone}${separator}body=${encodeURIComponent(fullMessage)}`;
        window.open(smsUrl, '_system');
        console.log(`SMS app opened for ${contact.name} (${contact.phone})`);
        // Small delay between opening SMS apps
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.warn('SMS sending only works on native mobile devices');
      throw new Error('SMS sending only available on mobile devices');
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
