import { useEffect, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      setShakeCount(0);
      return;
    }

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity;
      if (!acceleration) return;

      const currentTime = Date.now();
      if (currentTime - lastUpdate < 100) return;

      const timeDiff = currentTime - lastUpdate;
      lastUpdate = currentTime;

      const x = acceleration.x || 0;
      const y = acceleration.y || 0;
      const z = acceleration.z || 0;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const totalDelta = deltaX + deltaY + deltaZ;

      if (totalDelta > threshold && timeDiff > 0) {
        const now = Date.now();
        
        if (resetTimeout.current) {
          clearTimeout(resetTimeout.current);
        }

        setShakeCount(prev => {
          const newCount = prev + 1;
          
          Haptics.impact({ style: ImpactStyle.Medium });
          
          if (newCount >= requiredShakes) {
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
    };
  }, [threshold, requiredShakes, resetTime, onShake, enabled]);

  return { shakeCount };
};
