import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';

export const sendSOSMessages = async (message: string, contacts: Array<{ phone: string }>) => {
  try {
    // Get current location
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const { latitude, longitude } = position.coords;
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const fullMessage = `${message}\n\n${locationUrl}`;

    // Trigger success haptic
    await Haptics.notification({ type: NotificationType.Success });

    // In a real app, you would use a native SMS plugin
    // For now, we'll use the SMS URI scheme which works on Android
    contacts.forEach(contact => {
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(fullMessage)}`;
      window.open(smsUrl, '_blank');
    });

    return true;
  } catch (error) {
    console.error('Failed to send SOS:', error);
    await Haptics.notification({ type: NotificationType.Error });
    throw error;
  }
};
