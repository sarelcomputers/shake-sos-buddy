import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { startLocationTracking, generateTrackingUrl } from './locationTracking';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { captureEnhancedSOSData, uploadSOSFiles } from './enhancedSOS';

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

    console.log('🚨 ENHANCED SOS TRIGGERED - Starting 20-second capture process...');
    
    // Capture enhanced SOS data (audio, photos, WiFi) - takes 20 seconds
    const enhancedData = await captureEnhancedSOSData();
    
    console.log('Enhanced data captured, proceeding with alert...');
    
    // Format personal info for message if available
    let personalInfoText = '';
    if (personalInfo) {
      personalInfoText = `\n\nPersonal Information:\nName: ${personalInfo.name || 'N/A'} ${personalInfo.surname || ''}\nAge: ${personalInfo.age || 'N/A'}\nGender: ${personalInfo.gender || 'N/A'}\nBlood Type: ${personalInfo.blood_type || 'N/A'}\nMedical Aid: ${personalInfo.medical_aid_name || 'N/A'} (${personalInfo.medical_aid_number || 'N/A'})\nHome Address: ${personalInfo.home_address || 'N/A'}\nVehicle: ${personalInfo.vehicle_brand || 'N/A'} ${personalInfo.vehicle_color || ''} (${personalInfo.vehicle_registration || 'N/A'})\nSpouse: ${personalInfo.spouse_name || 'N/A'} (${personalInfo.spouse_contact || 'N/A'})\nFriend: ${personalInfo.friend_name || 'N/A'} ${personalInfo.friend_surname || ''} (${personalInfo.friend_contact || 'N/A'})`;
    }
    
    const fullMessage = `${message}\n${locationUrl}${personalInfoText}`;
    
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
    
    // Background tasks: Start long-running processes without blocking the main flow
    (async () => {
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

      // Upload enhanced SOS files to storage
      let fileUrls = { audioUrl: '', photoUrls: [] as string[] };
      try {
        fileUrls = await uploadSOSFiles(userId!, userId!, enhancedData);
        console.log('Files uploaded successfully:', fileUrls);
      } catch (error) {
        console.error('Error uploading SOS files:', error);
      }

      // Log SOS event to history with all captured data
      const { data: sosHistoryData, error: sosHistoryError } = await supabase
        .from('sos_history')
        .insert([{
          user_id: userId!,
          latitude,
          longitude,
          message,
          contacts_count: contacts.length,
          contacted_recipients: successfulContacts.map(c => ({
            name: c.name,
            phone: c.phone,
            timestamp: new Date().toISOString()
          })),
          device_model: `${deviceInfo.manufacturer} ${deviceInfo.model}`,
          device_serial: deviceId.identifier,
          ip_address: ipAddress,
          network_isp: networkStatus.connectionType,
          wifi_info: enhancedData.wifiInfo as any,
          personal_info: personalInfo,
          audio_duration_seconds: enhancedData.audioDuration,
          audio_transcript: null // Will be updated after transcription
        }])
        .select()
        .single();
      
      if (sosHistoryError) {
        console.error('Error logging SOS history:', sosHistoryError);
        return;
      }

      // Start live location tracking (1 minute)
      console.log('Starting live location tracking (1 minute)...');
      await startLocationTracking({
        sosHistoryId: sosHistoryData.id,
        userId: userId!,
        durationMinutes: 1
      });

      // Send enhanced control room notification with all attachments
      console.log('Sending enhanced control room notification with attachments...');
      const trackingUrl = generateTrackingUrl(sosHistoryData.id);
      
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
          wifiInfo: enhancedData.wifiFormatted,
          personalInfo,
          trackingUrl,
          contactsNotified: successfulContacts.length,
          audioUrl: fileUrls.audioUrl,
          photoUrls: fileUrls.photoUrls,
          audioDuration: enhancedData.audioDuration
        }
      });
      
      // Transcribe audio in background and update history
      console.log('Starting audio transcription...');
      try {
        const transcribeResponse = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: enhancedData.audioBase64 }
        });
        
        const audioTranscript = transcribeResponse.data?.text || null;
        console.log('Transcription complete:', audioTranscript ? 'Success' : 'No transcript');
        
        if (audioTranscript) {
          await supabase
            .from('sos_history')
            .update({ audio_transcript: audioTranscript })
            .eq('id', sosHistoryData.id);
        }
      } catch (error) {
        console.error('Error transcribing audio:', error);
      }
      
      // Success haptic
      await Haptics.impact({ style: ImpactStyle.Heavy });
    })();

    return true;
  } catch (error) {
    console.error('Error sending SOS messages:', error);
    await Haptics.impact({ style: ImpactStyle.Heavy });
    throw error;
  }
};
