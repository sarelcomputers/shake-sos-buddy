import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { Preferences } from '@capacitor/preferences';

interface LocationTrackingOptions {
  sosHistoryId: string;
  userId: string;
  durationMinutes?: number;
}

// Global tracking state
let currentTrackingState: {
  watchId: string | null;
  sosHistoryId: string | null;
  userId: string | null;
  endTime: number;
  intervalId: NodeJS.Timeout | null;
} = {
  watchId: null,
  sosHistoryId: null,
  userId: null,
  endTime: 0,
  intervalId: null
};

const TRACKING_STATE_KEY = 'location_tracking_state';

/**
 * Save tracking state to persistent storage
 */
async function saveTrackingState(): Promise<void> {
  await Preferences.set({
    key: TRACKING_STATE_KEY,
    value: JSON.stringify({
      sosHistoryId: currentTrackingState.sosHistoryId,
      userId: currentTrackingState.userId,
      endTime: currentTrackingState.endTime
    })
  });
}

/**
 * Load tracking state from persistent storage
 */
async function loadTrackingState(): Promise<void> {
  const { value } = await Preferences.get({ key: TRACKING_STATE_KEY });
  if (value) {
    try {
      const state = JSON.parse(value);
      if (state.endTime > Date.now()) {
        currentTrackingState.sosHistoryId = state.sosHistoryId;
        currentTrackingState.userId = state.userId;
        currentTrackingState.endTime = state.endTime;
      }
    } catch (e) {
      console.error('Error parsing tracking state:', e);
    }
  }
}

/**
 * Clear tracking state
 */
async function clearTrackingState(): Promise<void> {
  await Preferences.remove({ key: TRACKING_STATE_KEY });
  currentTrackingState = {
    watchId: null,
    sosHistoryId: null,
    userId: null,
    endTime: 0,
    intervalId: null
  };
}

/**
 * Get remaining tracking time in minutes
 */
export function getRemainingTrackingTime(): number {
  if (!currentTrackingState.endTime) return 0;
  const remaining = currentTrackingState.endTime - Date.now();
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
}

/**
 * Check if tracking is currently active
 */
export function isTrackingActive(): boolean {
  return currentTrackingState.endTime > Date.now() && currentTrackingState.sosHistoryId !== null;
}

/**
 * Extend the current tracking window by specified minutes
 */
export async function extendTrackingWindow(additionalMinutes: number = 60): Promise<void> {
  if (!currentTrackingState.sosHistoryId) {
    console.log('No active tracking to extend');
    return;
  }

  const newEndTime = Math.max(currentTrackingState.endTime, Date.now()) + (additionalMinutes * 60 * 1000);
  currentTrackingState.endTime = newEndTime;
  await saveTrackingState();
  
  console.log(`Tracking window extended by ${additionalMinutes} minutes. New end time: ${new Date(newEndTime).toLocaleTimeString()}`);
}

/**
 * Get the current active SOS history ID being tracked
 */
export function getCurrentTrackingSosId(): string | null {
  if (isTrackingActive()) {
    return currentTrackingState.sosHistoryId;
  }
  return null;
}

/**
 * Track a single location point
 */
async function trackSingleLocation(): Promise<void> {
  if (!currentTrackingState.sosHistoryId || !currentTrackingState.userId) {
    return;
  }

  // Check if we should stop tracking
  if (Date.now() >= currentTrackingState.endTime) {
    console.log('Tracking window expired');
    await stopLocationTracking();
    return;
  }

  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    const { coords, timestamp } = position;

    const { error } = await supabase
      .from('location_tracking')
      .insert({
        sos_history_id: currentTrackingState.sosHistoryId,
        user_id: currentTrackingState.userId,
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
      console.log('📍 Pin dropped:', {
        lat: coords.latitude.toFixed(6),
        lng: coords.longitude.toFixed(6),
        time: new Date(timestamp).toLocaleTimeString(),
        remaining: getRemainingTrackingTime() + ' min'
      });
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }
}

/**
 * Start tracking user location for a specified duration
 * Default is 60 minutes (1 hour)
 * If tracking is already active, extends the window instead
 */
export async function startLocationTracking({
  sosHistoryId,
  userId,
  durationMinutes = 60
}: LocationTrackingOptions): Promise<void> {
  
  // Check if tracking is already active for this or another SOS
  if (isTrackingActive()) {
    console.log('Tracking already active, extending window by 1 hour');
    
    // If same SOS, just extend the window
    if (currentTrackingState.sosHistoryId === sosHistoryId) {
      await extendTrackingWindow(durationMinutes);
      return;
    }
    
    // If different SOS, stop current tracking and start new
    console.log('New SOS detected, starting fresh tracking');
    await stopLocationTracking();
  }

  // Set up new tracking state
  currentTrackingState.sosHistoryId = sosHistoryId;
  currentTrackingState.userId = userId;
  currentTrackingState.endTime = Date.now() + (durationMinutes * 60 * 1000);
  
  await saveTrackingState();

  console.log(`🚀 Starting location tracking for ${durationMinutes} minutes`);
  console.log(`   SOS ID: ${sosHistoryId}`);
  console.log(`   End time: ${new Date(currentTrackingState.endTime).toLocaleTimeString()}`);

  // Track initial location immediately
  await trackSingleLocation();

  // Set up interval-based tracking as a reliable fallback (every 30 seconds)
  currentTrackingState.intervalId = setInterval(async () => {
    if (Date.now() >= currentTrackingState.endTime) {
      console.log('Interval tracking: window expired');
      await stopLocationTracking();
      return;
    }
    await trackSingleLocation();
  }, 30000); // Every 30 seconds for reliable pin drops

  // Also use watchPosition for real-time updates when position changes
  try {
    currentTrackingState.watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000 // Allow 5 seconds cache to reduce battery drain
      },
      async (position) => {
        if (!position) return;

        // Check if we should stop tracking
        if (Date.now() >= currentTrackingState.endTime) {
          console.log('Watch tracking: window expired');
          await stopLocationTracking();
          return;
        }

        const { coords, timestamp } = position;

        // Only store if position has significantly changed (10+ meters)
        const { error } = await supabase
          .from('location_tracking')
          .insert({
            sos_history_id: currentTrackingState.sosHistoryId,
            user_id: currentTrackingState.userId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            speed: coords.speed,
            heading: coords.heading,
            altitude: coords.altitude,
            timestamp: new Date(timestamp).toISOString()
          });

        if (error) {
          // Ignore duplicate errors, just log others
          if (!error.message?.includes('duplicate')) {
            console.error('Error storing watched location:', error);
          }
        } else {
          console.log('📍 Position update:', {
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
            speed: coords.speed ? (coords.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'
          });
        }
      }
    );
  } catch (error) {
    console.error('Error setting up location watch:', error);
    // Interval tracking will continue as fallback
  }
}

/**
 * Stop location tracking
 */
export async function stopLocationTracking(): Promise<void> {
  console.log('Stopping location tracking');

  if (currentTrackingState.watchId) {
    try {
      await Geolocation.clearWatch({ id: currentTrackingState.watchId });
    } catch (e) {
      console.error('Error clearing watch:', e);
    }
  }

  if (currentTrackingState.intervalId) {
    clearInterval(currentTrackingState.intervalId);
  }

  await clearTrackingState();
  console.log('Location tracking stopped');
}

/**
 * Generate a live tracking URL for the SOS alert
 */
export function generateTrackingUrl(sosHistoryId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/live-tracking/${sosHistoryId}`;
}

/**
 * Resume tracking if there was an active session (e.g., after app restart)
 */
export async function resumeTrackingIfActive(): Promise<void> {
  await loadTrackingState();
  
  if (isTrackingActive() && currentTrackingState.sosHistoryId && currentTrackingState.userId) {
    console.log('Resuming active tracking session');
    const remainingMinutes = getRemainingTrackingTime();
    
    if (remainingMinutes > 0) {
      // Restart tracking with remaining time
      const sosId = currentTrackingState.sosHistoryId;
      const userId = currentTrackingState.userId;
      const endTime = currentTrackingState.endTime;
      
      // Clear and restart
      await clearTrackingState();
      
      // Set the end time to the original end time (not adding new duration)
      currentTrackingState.sosHistoryId = sosId;
      currentTrackingState.userId = userId;
      currentTrackingState.endTime = endTime;
      
      await saveTrackingState();
      
      // Track initial location
      await trackSingleLocation();
      
      // Set up interval
      currentTrackingState.intervalId = setInterval(async () => {
        if (Date.now() >= currentTrackingState.endTime) {
          await stopLocationTracking();
          return;
        }
        await trackSingleLocation();
      }, 30000);

      // Set up watch
      try {
        currentTrackingState.watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          async (position) => {
            if (!position || Date.now() >= currentTrackingState.endTime) return;
            
            const { coords, timestamp } = position;
            await supabase
              .from('location_tracking')
              .insert({
                sos_history_id: currentTrackingState.sosHistoryId,
                user_id: currentTrackingState.userId,
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy,
                speed: coords.speed,
                heading: coords.heading,
                altitude: coords.altitude,
                timestamp: new Date(timestamp).toISOString()
              });
          }
        );
      } catch (e) {
        console.error('Error resuming watch:', e);
      }

      console.log(`Tracking resumed with ${remainingMinutes} minutes remaining`);
    }
  }
}
