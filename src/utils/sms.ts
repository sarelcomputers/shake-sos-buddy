import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { SmsManager } from '@byteowls/capacitor-sms';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
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

    // Capture device and network information
    let deviceInfo = null;
    let networkInfo = null;
    let wifiInfo = null;

    try {
      deviceInfo = await Device.getInfo();
      networkInfo = await Network.getStatus();
      
      // Capture WiFi information if available
      if (networkInfo.connectionType === 'wifi') {
        wifiInfo = {
          ssid: networkInfo.ssid || 'Unknown',
          connected: networkInfo.connected
        };
      }
    } catch (deviceError) {
      console.error('Failed to capture device info:', deviceError);
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
          contacted_recipients: contacts.map(c => ({ name: c.name, phone: c.phone })),
          device_model: deviceInfo ? `${deviceInfo.manufacturer} ${deviceInfo.model}` : null,
          device_serial: deviceInfo?.identifier || null,
          network_isp: networkInfo?.connectionType || null,
          ip_address: null, // IP address not directly available from Capacitor
          wifi_info: wifiInfo
        });

        // Send notification email to control room
        try {
          const { error: emailError } = await supabase.functions.invoke('send-sos-notification', {
            body: {
              userId,
              message,
              latitude,
              longitude,
              deviceModel: deviceInfo ? `${deviceInfo.manufacturer} ${deviceInfo.model}` : null,
              deviceSerial: deviceInfo?.identifier || null,
              networkIsp: networkInfo?.connectionType || null,
              wifiInfo,
              contactsCount: contacts.length,
            }
          });

          if (emailError) {
            console.error('Failed to send email notification:', emailError);
          } else {
            console.log('Email notification sent to control room');
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the SOS if email fails
        }
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
