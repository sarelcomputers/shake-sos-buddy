import { VoiceRecorder, blobToBase64 } from './voiceRecorder';
import { cameraCapture, CapturedPhoto } from './cameraCapture';
import { scanWifiNetworks, formatWifiInfo, NetworkInfo } from './wifiScanner';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedSOSData {
  audioBase64: string;
  audioDuration: number;
  photos: CapturedPhoto[];
  wifiInfo: NetworkInfo;
  wifiFormatted: string;
}

export async function captureEnhancedSOSData(): Promise<EnhancedSOSData> {
  console.log('⚡ Starting FAST enhanced SOS capture (15 seconds total)');
  
  const voiceRecorder = new VoiceRecorder();
  
  // Start audio recording (15 seconds)
  console.log('🎤 Starting 15-second audio recording...');
  const audioPromise = voiceRecorder.startRecording(15000);
  
  // Start camera capture (every 3 seconds for 15 seconds = 5 photos)
  console.log('📸 Starting camera capture (every 3s for 15s)...');
  const photosPromise = cameraCapture.startCapturing(3, 15);
  
  // Scan WiFi networks
  console.log('📡 Scanning WiFi networks...');
  const wifiPromise = scanWifiNetworks();
  
  // Wait for all captures to complete (15 seconds max)
  const [audioBlob, photos, wifiInfo] = await Promise.all([
    audioPromise,
    photosPromise,
    wifiPromise,
  ]);
  
  // Convert audio to base64
  const audioBase64 = await blobToBase64(audioBlob);
  
  // Format WiFi info
  const wifiFormatted = formatWifiInfo(wifiInfo);
  
  console.log('✅ Enhanced SOS capture complete (15s):', {
    audioSize: audioBlob.size,
    photosCount: photos.length,
    wifiNetworks: wifiInfo.nearbyNetworks.length,
  });
  
  return {
    audioBase64,
    audioDuration: 15,
    photos,
    wifiInfo,
    wifiFormatted,
  };
}

export async function uploadSOSFiles(
  sosHistoryId: string,
  userId: string,
  data: EnhancedSOSData
): Promise<{ audioUrl: string; photoUrls: string[] }> {
  console.log('Uploading SOS files to storage...');
  
  const photoUrls: string[] = [];
  const timestamp = Date.now();
  
  // Upload audio file
  const audioFileName = `${userId}/${sosHistoryId}/audio-${timestamp}.webm`;
  const audioBlob = new Blob(
    [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
    { type: 'audio/webm' }
  );
  
  const { data: audioData, error: audioError } = await supabase.storage
    .from('sos-recordings')
    .upload(audioFileName, audioBlob);
    
  if (audioError) {
    console.error('Error uploading audio:', audioError);
  }
  
  const { data: { publicUrl: audioUrl } } = supabase.storage
    .from('sos-recordings')
    .getPublicUrl(audioFileName);
  
  // Upload photos
  for (let i = 0; i < data.photos.length; i++) {
    const photo = data.photos[i];
    const photoFileName = `${userId}/${sosHistoryId}/photo-${i + 1}-${timestamp}.jpg`;
    const photoBlob = new Blob(
      [Uint8Array.from(atob(photo.base64), c => c.charCodeAt(0))],
      { type: 'image/jpeg' }
    );
    
    const { error: photoError } = await supabase.storage
      .from('sos-recordings')
      .upload(photoFileName, photoBlob);
      
    if (photoError) {
      console.error(`Error uploading photo ${i + 1}:`, photoError);
    } else {
      const { data: { publicUrl: photoUrl } } = supabase.storage
        .from('sos-recordings')
        .getPublicUrl(photoFileName);
      photoUrls.push(photoUrl);
    }
  }
  
  console.log('File uploads complete:', { audioUrl, photoCount: photoUrls.length });
  
  return { audioUrl, photoUrls };
}
