import { useEffect, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { storeMotionData } from '@/utils/backgroundRunner';
import { Preferences } from '@capacitor/preferences';

interface ShakeDetectionOptions {
  threshold: number;
  requiredShakes: number;
  resetTime: number;
  onShake: () => void;
  enabled: boolean;
}

export const useShakeDetection = ({
  threshold,
  requiredShakes,
  resetTime,
  onShake,
  enabled,
}: ShakeDetectionOptions) => {
  const [shakeCount, setShakeCount] = useState(0);
  const lastShakeTime = useRef<number>(0);
  const lastTriggerTime = useRef<number>(0);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);
  const COOLDOWN_PERIOD = 2 * 60 * 1000; // 2 minutes in milliseconds

  useEffect(() => {
    if (!enabled) {
      setShakeCount(0);
      // Allow device to sleep when disabled
      KeepAwake.allowSleep().catch(console.error);
      return;
    }

    // Keep device awake and sensors active when armed
    KeepAwake.keepAwake().catch(console.error);
    console.log('Device kept awake - shake detection active even when screen locks');

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;

    const handleMotion = async (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      if (currentTime - lastUpdate < 100) return;

      const timeDiff = currentTime - lastUpdate;
      lastUpdate = currentTime;

      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;
      
      // Store motion data for background runner
      storeMotionData(x, y, z).catch(console.error);

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > threshold && timeDiff > 0) {
        const now = Date.now();
        
        // Check for voice alert cooldown from Preferences
        try {
          const { value: cooldownValue } = await Preferences.get({ key: 'voice_alert_cooldown' });
          if (cooldownValue) {
            const cooldownUntil = parseInt(cooldownValue, 10);
            if (now < cooldownUntil) {
              const remainingSeconds = Math.ceil((cooldownUntil - now) / 1000);
              console.log(`🔇 Shake ignored - Voice alert cooldown active (${remainingSeconds}s remaining)`);
              return;
            } else {
              // Cooldown expired, clear it
              await Preferences.remove({ key: 'voice_alert_cooldown' });
            }
          }
        } catch (error) {
          console.error('Error checking cooldown:', error);
        }
        
        // Check if we're still in shake cooldown period
        const timeSinceLastTrigger = now - lastTriggerTime.current;
        const inCooldown = lastTriggerTime.current > 0 && timeSinceLastTrigger < COOLDOWN_PERIOD;
        
        if (inCooldown) {
          console.log(`Shake detected but in cooldown. ${Math.ceil((COOLDOWN_PERIOD - timeSinceLastTrigger) / 1000)}s remaining`);
          return; // Ignore shakes during cooldown
        }
        
        if (resetTimeout.current) {
          clearTimeout(resetTimeout.current);
        }

        setShakeCount(prev => {
          const newCount = prev + 1;
          
          Haptics.impact({ style: ImpactStyle.Medium });
          
          if (newCount >= requiredShakes) {
            lastTriggerTime.current = Date.now(); // Record trigger time
            onShake();
            return 0;
          }
          
          return newCount;
        });

        resetTimeout.current = setTimeout(() => {
          setShakeCount(0);
        }, resetTime);

        lastShakeTime.current = now;
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
      }
      // Allow device to sleep when hook unmounts
      KeepAwake.allowSleep().catch(console.error);
    };
  }, [threshold, requiredShakes, resetTime, onShake, enabled]);

  return { shakeCount };
};
