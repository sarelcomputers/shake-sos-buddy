import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { startLocationTracking, generateTrackingUrl } from './locationTracking';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { captureSimplifiedSOSData } from './enhancedSOS';
import { cameraCapture } from './cameraCapture';
import { SmsManager } from '@byteowls/capacitor-sms';

// Format phone number for South Africa (+27)
const formatSAPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.substring(1);
  }
  // If doesn't start with +, assume it needs +27
  else if (!cleaned.startsWith('+')) {
    cleaned = '+27' + cleaned;
  }
  
  return cleaned;
};

// Send SMS via device native carrier
const sendNativeSMS = async (
  phoneNumbers: string[],
  message: string
): Promise<{ successful: string[]; failed: string[] }> => {
  const successful: string[] = [];
  const failed: string[] = [];
  
  // Format all phone numbers for SA
  const formattedNumbers = phoneNumbers.map(formatSAPhoneNumber);
  
  try {
    // Check if SMS is available on this device
    const result = await SmsManager.send({
      numbers: formattedNumbers,
      text: message,
    });
    
    console.log('SMS send result:', result);
    
    // If we get here without error, consider all successful
    formattedNumbers.forEach(num => successful.push(num));
  } catch (error) {
    console.error('Error sending native SMS:', error);
    // Mark all as failed if bulk send fails
    formattedNumbers.forEach(num => failed.push(num));
  }
  
  return { successful, failed };
};

export const sendSOSMessages = async (
  message: string,
  contacts: Array<{ phone: string; name: string }>,
  userId?: string
): Promise<boolean> => {
  try {
    // Get current location
    const position = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    
    // Capture emergency photo from front camera
    console.log('📸 Capturing emergency photo...');
    let photoUrl: string | null = null;
    try {
      photoUrl = await cameraCapture.captureEmergencyPhoto(userId!);
      if (photoUrl) {
        console.log('✅ Photo captured and uploaded');
      } else {
        console.warn('⚠️ Failed to capture photo, continuing without it');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      console.warn('⚠️ Continuing without photo');
    }
    
    // Fetch personal information if userId is provided
    let personalInfo = null;
    if (userId) {
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        personalInfo = data;
      }
    }

    console.log('🚨 SOS TRIGGERED - Capturing WiFi data...');
    
    // Capture simplified SOS data (just WiFi)
    const simplifiedData = await captureSimplifiedSOSData();
    
    // Capture device and network information
    const deviceInfo = await Device.getInfo();
    const deviceId = await Device.getId();
    const networkStatus = await Network.getStatus();

    // Get IP address
    let ipAddress = null;
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (error) {
      console.error('Error getting IP address:', error);
    }

    // Log SOS event to history
    const { data: sosHistoryData, error: sosHistoryError } = await supabase
      .from('sos_history')
      .insert([{
        user_id: userId!,
        latitude,
        longitude,
        message,
        contacts_count: contacts.length,
        contacted_recipients: [],
        device_model: `${deviceInfo.manufacturer} ${deviceInfo.model}`,
        device_serial: deviceId.identifier,
        ip_address: ipAddress,
        network_isp: networkStatus.connectionType,
        wifi_info: simplifiedData.wifiInfo as any,
        personal_info: personalInfo,
      }])
      .select()
      .single();
    
    if (sosHistoryError) {
      console.error('Error logging SOS history:', sosHistoryError);
      throw sosHistoryError;
    }

    // Start live location tracking (5 minutes)
    console.log('Starting live location tracking (5 minutes)...');
    startLocationTracking({
      sosHistoryId: sosHistoryData.id,
      userId: userId!,
      durationMinutes: 5
    });

    // Generate tracking URL (valid for 5 minutes)
    const trackingUrl = generateTrackingUrl(sosHistoryData.id);
    
    // Format personal info for message if available
    let personalInfoText = '';
    if (personalInfo) {
      const parts = [];
      if (personalInfo.name || personalInfo.surname) parts.push(`Name: ${personalInfo.name || ''} ${personalInfo.surname || ''}`);
      if (personalInfo.age) parts.push(`Age: ${personalInfo.age}`);
      if (personalInfo.gender) parts.push(`Gender: ${personalInfo.gender}`);
      if (personalInfo.blood_type) parts.push(`Blood: ${personalInfo.blood_type}`);
      if (personalInfo.medical_aid_name) parts.push(`Medical Aid: ${personalInfo.medical_aid_name}`);
      if (personalInfo.home_address) parts.push(`Address: ${personalInfo.home_address}`);
      if (personalInfo.vehicle_registration) parts.push(`Vehicle: ${personalInfo.vehicle_brand || ''} ${personalInfo.vehicle_registration}`);
      
      if (parts.length > 0) {
        personalInfoText = `\n\nPersonal Info:\n${parts.join('\n')}`;
      }
    }
    
    const fullMessage = `${message}\n\n📍 Location: ${locationUrl}\n\n🔴 Live Tracking (5min): ${trackingUrl}${photoUrl ? `\n\n📷 Photo: ${photoUrl}` : ''}${personalInfoText}\n\n📡 Nearby WiFi: ${simplifiedData.wifiNames}`;
    
    console.log('✅ Sending SMS via device carrier and Email alerts...');
    
    // Send SMS via native device carrier (uses user's SMS bundle)
    const phoneNumbers = contacts.map(c => c.phone);
    const smsResult = await sendNativeSMS(phoneNumbers, fullMessage);
    
    console.log(`SMS sent: ${smsResult.successful.length} successful, ${smsResult.failed.length} failed`);
    
    const successfulContacts = contacts.filter(c => 
      smsResult.successful.includes(formatSAPhoneNumber(c.phone))
    );
    
    const failedCount = smsResult.failed.length;
    
    if (failedCount > 0) {
      console.warn(`${failedCount} messages failed to send`);
    }
    
    // Update SOS history with successful contacts
    await supabase
      .from('sos_history')
      .update({
        contacted_recipients: successfulContacts.map(c => ({
          name: c.name,
          phone: c.phone,
          timestamp: new Date().toISOString()
        }))
      })
      .eq('id', sosHistoryData.id);
    
    // Get emergency email contacts and send emails
    const { data: emailContacts } = await supabase
      .from('emergency_emails')
      .select('*')
      .eq('user_id', userId!);
    
    if (emailContacts && emailContacts.length > 0) {
      console.log('Sending emails to emergency contacts...');
      await Promise.allSettled(
        emailContacts.map(async (contact) => {
          await supabase.functions.invoke('send-emergency-email', {
            body: {
              to: contact.email,
              name: contact.name,
              subject: '🚨 EMERGENCY ALERT',
              message,
              location: locationUrl,
              trackingUrl,
              personalInfo,
              wifiNames: simplifiedData.wifiNames,
              photoUrl
            }
          });
        })
      );
    }

    // Get emergency WhatsApp contacts and send WhatsApp messages
    const { data: whatsappContacts } = await supabase
      .from('emergency_whatsapp')
      .select('*')
      .eq('user_id', userId!);
    
    if (whatsappContacts && whatsappContacts.length > 0) {
      console.log('Sending WhatsApp messages to emergency contacts...');
      const whatsappPhones = whatsappContacts.map(c => c.phone);
      
      await supabase.functions.invoke('send-whatsapp-twilio', {
        body: {
          phoneNumbers: whatsappPhones,
          message: fullMessage
        }
      });
    }

    
    // Success haptic
    await Haptics.impact({ style: ImpactStyle.Heavy });

    return true;
  } catch (error) {
    console.error('Error sending SOS messages:', error);
    await Haptics.impact({ style: ImpactStyle.Heavy });
    throw error;
  }
};
