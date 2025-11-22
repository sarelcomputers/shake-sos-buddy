import { Geolocation } from '@capacitor/geolocation';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { SmsManager } from '@byteowls/capacitor-sms';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder, blobToBase64 } from './voiceRecorder';

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

    // Start voice recording (2 minutes)
    let audioTranscript = null;
    let audioDurationSeconds = null;
    
    const voiceRecorder = new VoiceRecorder();

    console.log('Starting 2-minute voice recording for emergency context...');
    const recordingPromise = voiceRecorder.startRecording(120000) // 2 minutes
      .then(async (audioBlob) => {
        console.log('Voice recording completed, transcribing...');
        audioDurationSeconds = 120; // 2 minutes

        try {
          // Convert audio to base64
          const base64Audio = await blobToBase64(audioBlob);

          // Send to transcription edge function
          const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
            'transcribe-audio',
            {
              body: { audio: base64Audio }
            }
          );

          if (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
          } else if (transcriptionData?.text) {
            audioTranscript = transcriptionData.text;
            console.log('Transcription successful:', audioTranscript.substring(0, 100) + '...');
          }
        } catch (transcriptionError) {
          console.error('Failed to transcribe audio:', transcriptionError);
        }
      })
      .catch((error) => {
        console.error('Voice recording failed:', error);
      });

    // Fetch personal information
    let personalInfo = null;
    if (userId) {
      try {
        const { data: personalData } = await supabase
          .from('personal_info')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (personalData) {
          personalInfo = personalData;
        }
      } catch (error) {
        console.error('Failed to fetch personal info:', error);
      }
    }

    // Wait for voice recording to complete (run in background)
    recordingPromise.finally(() => {
      // Update the history with transcription if available
      if (userId && (audioTranscript || audioDurationSeconds)) {
        supabase.from('sos_history')
          .update({
            audio_transcript: audioTranscript,
            audio_duration_seconds: audioDurationSeconds
          })
          .eq('user_id', userId)
          .order('triggered_at', { ascending: false })
          .limit(1)
          .then(({ error }) => {
            if (error) {
              console.error('Failed to update audio transcription:', error);
            } else {
              console.log('Audio transcription saved to history');
            }
          });
      }
    });

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
          wifi_info: wifiInfo,
          personal_info: personalInfo || {},
          audio_transcript: null, // Will be updated when recording completes
          audio_duration_seconds: null
        });

        // Send notification email to control room (note: transcript will be sent separately when available)
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
              personalInfo: personalInfo || null,
              audioTranscript: null, // Will be available after 2 minutes
              audioDurationSeconds: null
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
