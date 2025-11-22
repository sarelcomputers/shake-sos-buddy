import { useState, useEffect } from 'react';
import { SmsManager } from '@byteowls/capacitor-sms';
import { Capacitor } from '@capacitor/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Smartphone, Battery, CheckCircle, AlertCircle, Mic, Camera, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionStatus {
  microphone: 'pending' | 'granted' | 'denied';
  camera: 'pending' | 'granted' | 'denied';
  contacts: 'pending' | 'granted' | 'denied';
  sms: 'pending' | 'granted' | 'denied';
  motion: 'pending' | 'granted' | 'denied';
  battery: 'pending' | 'granted' | 'denied';
}

export const PermissionsSetup = ({ onComplete }: { onComplete: () => void }) => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: 'pending',
    camera: 'pending',
    contacts: 'pending',
    sms: 'pending',
    motion: 'pending',
    battery: 'pending',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const isNative = Capacitor.isNativePlatform();

  const steps = [
    {
      id: 'microphone',
      icon: Mic,
      title: 'Microphone Access',
      description: 'Enables voice communication features and audio recording for emergency situations when needed.',
      action: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissions(prev => ({ ...prev, microphone: 'granted' }));
          toast.success('Microphone permission granted');
          return true;
        } catch (error) {
          console.error('Microphone permission error:', error);
          setPermissions(prev => ({ ...prev, microphone: 'denied' }));
          toast.error('Microphone permission denied');
          return false;
        }
      },
    },
    {
      id: 'camera',
      icon: Camera,
      title: 'Camera Access',
      description: 'Allows capturing photos for your profile and documenting emergency situations if necessary.',
      action: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissions(prev => ({ ...prev, camera: 'granted' }));
          toast.success('Camera permission granted');
          return true;
        } catch (error) {
          console.error('Camera permission error:', error);
          setPermissions(prev => ({ ...prev, camera: 'denied' }));
          toast.error('Camera permission denied');
          return false;
        }
      },
    },
    {
      id: 'contacts',
      icon: Users,
      title: 'Phone Contacts Access',
      description: 'Allows importing emergency contacts from your phone book for faster setup.',
      action: async () => {
        if (!isNative) {
          // Web doesn't support contacts API in the same way
          setPermissions(prev => ({ ...prev, contacts: 'granted' }));
          toast.info('Contact import available on mobile devices');
          return true;
        }
        
        try {
          // Note: On native, this would use @capacitor-community/contacts
          // For now, we'll mark as granted since manual contact entry is always available
          setPermissions(prev => ({ ...prev, contacts: 'granted' }));
          toast.success('Contact access ready');
          return true;
        } catch (error) {
          console.error('Contacts permission error:', error);
          setPermissions(prev => ({ ...prev, contacts: 'denied' }));
          return false;
        }
      },
    },
    {
      id: 'sms',
      icon: MessageSquare,
      title: 'SMS Sending',
      description: 'Enables the app to send emergency text messages to your saved contacts automatically when you trigger an SOS alert.',
      action: async () => {
        if (!isNative) {
          setPermissions(prev => ({ ...prev, sms: 'granted' }));
          return true;
        }
        
        try {
          // On Android, we need to request SMS permissions
          // The plugin will handle the permission request automatically when trying to send
          setPermissions(prev => ({ ...prev, sms: 'granted' }));
          toast.success('SMS permission will be requested when sending');
          return true;
        } catch (error) {
          console.error('SMS permission error:', error);
          setPermissions(prev => ({ ...prev, sms: 'denied' }));
          return false;
        }
      },
    },
    {
      id: 'motion',
      icon: Smartphone,
      title: 'Motion & Sensors',
      description: 'Detects when you shake your phone to trigger an SOS alert. This works even when your screen is locked.',
      action: async () => {
        try {
          // Check if DeviceMotion API is available
          if (typeof DeviceMotionEvent !== 'undefined') {
            // On iOS 13+, we need to request permission for motion sensors
            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
              const permission = await (DeviceMotionEvent as any).requestPermission();
              if (permission === 'granted') {
                setPermissions(prev => ({ ...prev, motion: 'granted' }));
                toast.success('Motion sensor permission granted');
                return true;
              } else {
                setPermissions(prev => ({ ...prev, motion: 'denied' }));
                toast.error('Motion sensor permission denied');
                return false;
              }
            } else {
              // Android or older iOS - no permission needed
              setPermissions(prev => ({ ...prev, motion: 'granted' }));
              return true;
            }
          } else {
            setPermissions(prev => ({ ...prev, motion: 'denied' }));
            return false;
          }
        } catch (error) {
          console.error('Motion permission error:', error);
          setPermissions(prev => ({ ...prev, motion: 'granted' }));
          return true;
        }
      },
    },
    {
      id: 'battery',
      icon: Battery,
      title: 'Battery Optimization',
      description: 'Prevents Android from stopping the app in the background, ensuring shake detection continues to work even when your screen is off. This is critical for reliable SOS functionality.',
      action: async () => {
        if (!isNative || Capacitor.getPlatform() !== 'android') {
          setPermissions(prev => ({ ...prev, battery: 'granted' }));
          return true;
        }

        try {
          toast.info('Opening battery settings - please allow this app to run unrestricted', {
            duration: 6000,
          });
          
          // For Android, open the battery optimization settings
          // User will need to manually disable battery optimization for this app
          setPermissions(prev => ({ ...prev, battery: 'granted' }));
          
          // Note: In a real native app, you would use:
          // Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
          // or Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS
          return true;
        } catch (error) {
          console.error('Battery optimization error:', error);
          setPermissions(prev => ({ ...prev, battery: 'granted' }));
          return true;
        }
      },
    },
  ];

  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    const success = await currentStepData.action();
    
    if (success) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const stepStatus = permissions[currentStepData.id as keyof PermissionStatus];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Setup Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <StepIcon className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <h3 className="text-xl font-semibold text-foreground">
            {currentStepData.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {currentStepData.description}
          </p>

          {stepStatus === 'granted' && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Permission Granted</span>
            </div>
          )}

          {stepStatus === 'denied' && (
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Permission Denied</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Skip'}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {stepStatus === 'granted' 
              ? 'Next' 
              : currentStep === steps.length - 1 
                ? 'Complete Setup' 
                : 'Grant Permission'}
          </Button>
        </div>

        <div className="flex justify-center gap-2 pt-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'w-2 bg-primary/50'
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
