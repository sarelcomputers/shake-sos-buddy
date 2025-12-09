import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

interface LocationTrackingOptions {
  sosHistoryId: string;
  userId: string;
  durationMinutes?: number;
}

/**
 * Start tracking user location for a specified duration
 * Default is 60 minutes (1 hour)
 */
export async function startLocationTracking({
  sosHistoryId,
  userId,
  durationMinutes = 60
}: LocationTrackingOptions): Promise<void> {
  const endTime = Date.now() + (durationMinutes * 60 * 1000);
  let watchId: string | null = null;

  console.log(`Starting location tracking for ${durationMinutes} minutes`);

  const trackLocation = async () => {
    try {
      // Check if we should stop tracking
      if (Date.now() >= endTime) {
        if (watchId) {
          await Geolocation.clearWatch({ id: watchId });
        }
        console.log('Location tracking completed');
        return;
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const { coords, timestamp } = position;

      // Store location in database
      const { error } = await supabase
        .from('location_tracking')
        .insert({
          sos_history_id: sosHistoryId,
          user_id: userId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          altitude: coords.altitude,
          timestamp: new Date(timestamp).toISOString()
        });

      if (error) {
        console.error('Error storing location:', error);
      } else {
        console.log('Location tracked:', {
          lat: coords.latitude,
          lng: coords.longitude,
          time: new Date(timestamp).toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Track initial location immediately
  await trackLocation();

  // Watch position with high accuracy
  // Update every 10 seconds for precise tracking
  try {
    watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      },
      async (position) => {
        if (!position) return;

        // Check if we should stop tracking
        if (Date.now() >= endTime) {
          if (watchId) {
            await Geolocation.clearWatch({ id: watchId });
          }
          console.log('Location tracking completed');
          return;
        }

        const { coords, timestamp } = position;

        // Store location in database
        const { error } = await supabase
          .from('location_tracking')
          .insert({
            sos_history_id: sosHistoryId,
            user_id: userId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            speed: coords.speed,
            heading: coords.heading,
            altitude: coords.altitude,
            timestamp: new Date(timestamp).toISOString()
          });

        if (error) {
          console.error('Error storing location:', error);
        } else {
          console.log('Location updated:', {
            lat: coords.latitude,
            lng: coords.longitude,
            time: new Date(timestamp).toLocaleTimeString()
          });
        }
      }
    );

    // Set timeout to stop tracking after duration
    setTimeout(async () => {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
        console.log('Location tracking stopped after timeout');
      }
    }, durationMinutes * 60 * 1000);

  } catch (error) {
    console.error('Error setting up location watch:', error);
  }
}

/**
 * Generate a live tracking URL for the SOS alert
 */
export function generateTrackingUrl(sosHistoryId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/live-tracking/${sosHistoryId}`;
}
