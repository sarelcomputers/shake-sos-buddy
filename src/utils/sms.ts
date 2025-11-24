import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { startLocationTracking, generateTrackingUrl } from './locationTracking';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { captureSimplifiedSOSData } from './enhancedSOS';

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
    
    const fullMessage = `${message}\n\n📍 Location: ${locationUrl}\n\n🔴 Live Tracking (5min): ${trackingUrl}${personalInfoText}\n\n📡 Nearby WiFi: ${simplifiedData.wifiNames}`;
    
    console.log('✅ Sending SMS and Email alerts...');
    
    // Send SMS to all contacts
    const results = await Promise.allSettled(
      contacts.map(async (contact) => {
        const response = await supabase.functions.invoke('send-sms-twilio', {
          body: { 
            to: contact.phone, 
            message: fullMessage 
          }
        });
        
        if (response.error) {
          console.error(`Error sending SMS to ${contact.name}:`, response.error);
          throw new Error(`Failed to send to ${contact.name}`);
        }
        
        return contact;
      })
    );
    
    const successfulContacts = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    const failedCount = results.filter(result => result.status === 'rejected').length;
    
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
    
    // Send notification to control room
    console.log('Sending control room notification...');
    await supabase.functions.invoke('send-sos-notification', {
      body: {
        userId: userId!,
        message,
        latitude,
        longitude,
        deviceModel: `${deviceInfo.manufacturer} ${deviceInfo.model}`,
        deviceSerial: deviceId.identifier,
        ipAddress,
        networkISP: networkStatus.connectionType,
        wifiNames: simplifiedData.wifiNames,
        personalInfo,
        trackingUrl,
        contactsNotified: successfulContacts.length,
      }
    });
    
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
              wifiNames: simplifiedData.wifiNames
            }
          });
        })
      );
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
