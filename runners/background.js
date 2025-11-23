/**
 * Background Runner for Shake Detection
 * This script runs in the background even when the app is closed
 * It monitors device motion and triggers SOS alerts when shakes are detected
 */

addEventListener('shakeDetection', async (resolve, reject) => {
  console.log('Background shake detection runner started');
  
  try {
    // Get stored settings from CapacitorKV (Background Runner storage)
    const isArmed = await CapacitorKV.get('sos_armed');
    const sensitivity = await CapacitorKV.get('shake_sensitivity') || '25';
    const requiredShakes = await CapacitorKV.get('required_shakes') || '3';
    
    if (isArmed !== 'true') {
      console.log('SOS system not armed, skipping shake detection');
      resolve();
      return;
    }

    console.log(`Background monitoring active - Sensitivity: ${sensitivity}, Required shakes: ${requiredShakes}`);
    
    // Monitor device motion
    let shakeCount = 0;
    let lastShakeTime = 0;
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastUpdate = 0;
    
    const threshold = parseFloat(sensitivity);
    const requiredShakesCount = parseInt(requiredShakes);
    const resetTime = 3000; // 3 seconds to complete shakes
    
    // Function to check motion data
    const checkMotion = async () => {
      try {
        // On Android, we can access accelerometer data
        const motion = await CapacitorKV.get('last_motion_data');
        if (!motion) return;
        
        const data = JSON.parse(motion);
        const currentTime = Date.now();
        
        if (currentTime - lastUpdate < 100) return;
        
        const timeDiff = currentTime - lastUpdate;
        lastUpdate = currentTime;
        
        const x = data.x || 0;
        const y = data.y || 0;
        const z = data.z || 0;
        
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        const totalDelta = deltaX + deltaY + deltaZ;
        
        if (totalDelta > threshold && timeDiff > 0) {
          const now = Date.now();
          
          // Reset if too much time has passed
          if (now - lastShakeTime > resetTime) {
            shakeCount = 0;
          }
          
          shakeCount++;
          lastShakeTime = now;
          
          console.log(`Shake detected in background! Count: ${shakeCount}/${requiredShakesCount}`);
          
          if (shakeCount >= requiredShakesCount) {
            console.log('Required shakes reached! Triggering SOS...');
            
            // Trigger SOS alert by sending notification to the app
            await CapacitorKV.set('trigger_sos', 'true');
            
            // Send local notification to wake up the app
            await Notifications.schedule({
              notifications: [{
                title: 'SOS Alert Triggered',
                body: 'Emergency alert has been activated',
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 100) }
              }]
            });
            
            shakeCount = 0;
          }
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
        
      } catch (error) {
        console.error('Error checking motion:', error);
      }
    };
    
    // Run motion check every 100ms for responsive shake detection
    const checkInterval = setInterval(checkMotion, 100);
    
    // Run for 50 seconds (background runner runs for limited time)
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('Background shake detection cycle complete');
      resolve();
    }, 50000);
    
  } catch (error) {
    console.error('Background runner error:', error);
    reject(error);
  }
});

// Handle runner lifecycle
addEventListener('beforeunload', (ev) => {
  console.log('Background runner shutdown:', ev.detail?.reason);
});
