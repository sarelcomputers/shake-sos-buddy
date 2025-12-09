import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, Settings as SettingsIcon, Users, UserCircle, History, Shield, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOSStatus } from '@/components/SOSStatus';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { ContactList } from '@/components/ContactList';
import { EmailContactList, type EmailContact } from '@/components/EmailContactList';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ProfileSettings } from '@/components/ProfileSettings';
import { PersonalInformation } from '@/components/PersonalInformation';
import { AddContactDialog } from '@/components/AddContactDialog';
import { AddEmailContactDialog } from '@/components/AddEmailContactDialog';
import { PermissionsSetup } from '@/components/PermissionsSetup';
import { SubscriptionGate } from '@/components/SubscriptionGate';
import { useSOSSettings, type Contact } from '@/hooks/useSOSSettings';
import { supabase } from '@/integrations/supabase/client';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { sendSOSMessages } from '@/utils/sms';
import { toast } from '@/hooks/use-toast';
import alfa22Logo from '@/assets/alfa22-logo.png';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { checkBackgroundSOSTrigger } from '@/utils/backgroundRunner';
import { startForegroundService, stopForegroundService, isForegroundServiceAvailable } from '@/utils/foregroundService';


const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, loading: subscriptionLoading, subscription } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const {
    settings,
    loading,
    toggleEnabled,
    updateMessage,
    updateTestMessage,
    updateEmailMessage,
    updateTestEmailMessage,
    updateSensitivity,
    updateShakeCount,
    updateSmsTriggerEnabled,
    updateCooldownPeriod,
    addContact,
    removeContact,
    addEmailContact,
    removeEmailContact,
    saveAllSettings,
  } = useSOSSettings();

  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddEmailContact, setShowAddEmailContact] = useState(false);
  const [permissionsComplete, setPermissionsComplete] = useState(false);

  useEffect(() => {
    // Check if user has completed permissions setup
    const hasCompletedSetup = localStorage.getItem('permissions_setup_complete');
    if (hasCompletedSetup === 'true') {
      setPermissionsComplete(true);
    }
  }, []);

  // Listen for service worker SOS triggers (PWA background)
  useEffect(() => {
    const handleServiceWorkerSOS = async () => {
      console.log('🚨 Service worker triggered SOS!');
      if (settings.enabled) {
        await handleSOS();
      }
    };

    window.addEventListener('sw-sos-trigger', handleServiceWorkerSOS);
    return () => window.removeEventListener('sw-sos-trigger', handleServiceWorkerSOS);
  }, [settings.enabled]);

  // Communicate armed state to service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: settings.enabled ? 'ARM_SYSTEM' : 'DISARM_SYSTEM',
      });
    }
  }, [settings.enabled]);

  // Check for background SOS triggers when app is reopened
  useEffect(() => {
    if (!settings.enabled) return;
    
    // For native apps, check background runner
    if (Capacitor.isNativePlatform()) {
      const checkInterval = setInterval(async () => {
        const shouldTrigger = await checkBackgroundSOSTrigger();
        if (shouldTrigger) {
          console.log('Background runner triggered SOS!');
          await handleSOS();
        }
      }, 2000);
      
      return () => clearInterval(checkInterval);
    }
  }, [settings.enabled]);

  // Keep device awake when system is armed to ensure shake detection works

  // Keep device awake when system is armed to ensure shake and voice detection work
  useEffect(() => {
    const manageWakeLock = async () => {
      if (settings.enabled) {
        try {
          await KeepAwake.keepAwake();
          console.log('✅ Wake lock enabled - device will stay awake for detection');
          
          // Also request screen wake lock for web browsers
          if ('wakeLock' in navigator) {
            try {
              const wakeLock = await (navigator as any).wakeLock.request('screen');
              console.log('✅ Screen wake lock acquired');
              
              // Re-acquire on visibility change
              document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible' && settings.enabled) {
                  await (navigator as any).wakeLock.request('screen');
                }
              });
            } catch (err) {
              console.log('Screen wake lock not available:', err);
            }
          }
        } catch (error) {
          console.error('Failed to enable wake lock:', error);
        }
      } else {
        try {
          await KeepAwake.allowSleep();
          console.log('💤 Wake lock disabled');
        } catch (error) {
          console.error('Failed to disable wake lock:', error);
        }
      }
    };

    manageWakeLock();
  }, [settings.enabled]);

  const handlePermissionsComplete = () => {
    localStorage.setItem('permissions_setup_complete', 'true');
    setPermissionsComplete(true);
    toast({
      title: "Setup Complete!",
      description: "You're all set to use Alfa22 SOS",
    });
  };

  const handleToggle = async () => {
    // Check if permissions are complete before enabling
    if (!permissionsComplete && !settings.enabled) {
      toast({
        title: "Setup Required",
        description: "Please complete permissions setup first",
        variant: "destructive",
      });
      return;
    }

    const willBeEnabled = !settings.enabled;
    
    // If enabling, verify and request all required permissions
    if (willBeEnabled) {
      try {
        // Request location permissions (foreground and background)
        console.log('🔐 Requesting location permissions...');
        
        // Handle web vs native differently
        if (Capacitor.isNativePlatform()) {
          const locationPermission = await Geolocation.requestPermissions();
          
          if (locationPermission.location !== 'granted' && locationPermission.coarseLocation !== 'granted') {
            toast({
              title: "Location Required",
              description: "Location permission is required for SOS alerts. Please enable it in settings.",
              variant: "destructive",
            });
            return;
          }
        } else {
          // For web, try to get location which will trigger the permission prompt
          try {
            await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
              });
            });
            console.log('✅ Web location permission granted');
          } catch (geoError: any) {
            if (geoError?.code === 1) { // PERMISSION_DENIED
              toast({
                title: "Location Required",
                description: "Location permission is required for SOS alerts. Please allow location access.",
                variant: "destructive",
              });
              return;
            }
            console.warn('⚠️ Location test failed:', geoError);
          }
        }
        
        // Verify location is working with high accuracy (native only)
        if (Capacitor.isNativePlatform()) {
          try {
            const testPosition = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 10000,
            });
            console.log('✅ Location verified:', testPosition.coords.latitude, testPosition.coords.longitude);
          } catch (locError) {
            console.warn('⚠️ Location test failed, but permissions granted:', locError);
          }
        }
        
        // Request motion sensor permission (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          try {
            const motionPermission = await (DeviceMotionEvent as any).requestPermission();
            if (motionPermission !== 'granted') {
              toast({
                title: "Motion Sensor Required",
                description: "Motion sensor permission is needed for shake detection.",
                variant: "destructive",
              });
              return;
            }
            console.log('✅ Motion sensor permission granted');
          } catch (motionError) {
            console.error('Motion permission error:', motionError);
          }
        }
        
        // Request notification permission for PWA
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        
        console.log('✅ All permissions verified - arming system');
      } catch (error) {
        console.error('❌ Permission error:', error);
        toast({
          title: "Permission Error",
          description: "Could not verify permissions. Please check your device settings.",
          variant: "destructive",
        });
        return;
      }
    }
    
    toggleEnabled();
    
    // Store armed state for background runner
    try {
      await Preferences.set({
        key: 'sos_armed',
        value: willBeEnabled ? 'true' : 'false',
      });
      
      // Store settings for background runner
      await Preferences.set({
        key: 'shake_sensitivity',
        value: settings.sensitivity.toString(),
      });
      
      await Preferences.set({
        key: 'required_shakes',
        value: settings.shakeCount.toString(),
      });
      
      // Store user ID and contacts for background SOS trigger
      if (user?.id) {
        await Preferences.set({
          key: 'user_id',
          value: user.id,
        });
      }
      
      await Preferences.set({
        key: 'sos_message',
        value: settings.message,
      });
      
      await Preferences.set({
        key: 'contacts_json',
        value: JSON.stringify(settings.contacts),
      });
      
      await Preferences.set({
        key: 'email_contacts_json',
        value: JSON.stringify(settings.emailContacts),
      });
    } catch (error) {
      console.error('Error storing background settings:', error);
    }
    
    // Start/stop Android foreground service for true background detection
    if (Capacitor.getPlatform() === 'android') {
      if (willBeEnabled) {
        const serviceStarted = await startForegroundService();
        if (serviceStarted) {
          console.log('✅ Android foreground service started for background detection');
        } else if (isForegroundServiceAvailable()) {
          console.log('⚠️ Foreground service available but failed to start');
        } else {
          console.log('ℹ️ Foreground service not available (native code not installed)');
        }
      } else {
        await stopForegroundService();
        console.log('🛑 Android foreground service stopped');
      }
    }
    
    if (willBeEnabled) {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      
      const foregroundMsg = platform === 'android' && isForegroundServiceAvailable()
        ? ' Background service running with persistent notification.'
        : '';
      
      toast({
        title: "System Armed ✓",
        description: isNative 
          ? `Background monitoring enabled.${foregroundMsg}${platform === 'ios' ? ' Keep app in foreground on iOS.' : ''}`
          : `Device will stay awake and monitor for shakes.`,
        duration: 6000,
      });
    } else {
      toast({
        title: "System Disarmed",
        description: "Shake detection and background monitoring disabled",
      });
    }
  };

  const handleSOS = async () => {
    try {
      if (settings.contacts.length === 0 && settings.emailContacts.length === 0) {
        toast({
          title: "No contacts added",
          description: "Please add emergency contacts or emails before activating SOS",
          variant: "destructive",
        });
        return;
      }

      console.log('🚨 SOS TRIGGERED - Checking permissions...');
      
      // Check and request location permissions if needed (handle web vs native)
      if (Capacitor.isNativePlatform()) {
        const permissionStatus = await Geolocation.checkPermissions();
        console.log('📍 Location permission status:', permissionStatus);
        
        if (permissionStatus.location !== 'granted') {
          console.log('⚠️ Location permission not granted, requesting...');
          const requestResult = await Geolocation.requestPermissions();
          console.log('📍 Permission request result:', requestResult);
          
          if (requestResult.location !== 'granted') {
            toast({
              title: "Permission Required",
              description: "Location permission is required to send SOS alerts. Please enable it in your device settings.",
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        // For web, permissions are checked when getting location
        console.log('📍 Web platform - location permission will be checked on access');
      }

      // Always use enhanced SOS flow with audio, photos, and WiFi capture
      console.log('🚨 ENHANCED SOS TRIGGERED - Starting capture process...');
      
      // Send SMS with enhanced data if contacts exist AND SMS trigger is enabled
      if (settings.smsTriggerEnabled && settings.contacts.length > 0) {
        await sendSOSMessages(settings.message, settings.contacts, user?.id);
      }

      // Send enhanced email alerts if email contacts exist  
      if (settings.emailContacts.length > 0 && user?.id) {
        await sendEnhancedEmergencyEmails(settings.emailMessage, settings.emailContacts, user.id);
      }

      toast({
        title: "SOS Sent!",
        description: "Emergency alerts sent to all contacts",
      });
    } catch (error) {
      console.error('❌ SOS Error:', error);
      toast({
        title: "Failed to send SOS",
        description: error instanceof Error ? error.message : "Please check your permissions and try again",
        variant: "destructive",
      });
    }
  };

  const handleTestSOS = async (contact: Contact) => {
    try {
      await sendSOSMessages(settings.testMessage, [contact], user?.id);
      toast({
        title: "Test Message Sent!",
        description: `Test SMS sent to ${contact.name}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not send test message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestEmail = async (contact: EmailContact) => {
    try {
      await sendTestEmail(settings.testEmailMessage, contact);
      toast({
        title: "Test Email Sent!",
        description: `Test email sent to ${contact.name}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not send test email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendTestEmail = async (message: string, contact: EmailContact) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.functions.invoke('send-emergency-email', {
      body: {
        to: contact.email,
        name: contact.name,
        subject: '[TEST] Emergency Alert Test',
        message: message,
      },
    });
  };

  const sendEmergencyEmails = async (message: string, contacts: EmailContact[], userId: string) => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Get personal info
      const { data: personalInfo } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Send to all email contacts
      await Promise.all(
        contacts.map(contact =>
          supabase.functions.invoke('send-emergency-email', {
            body: {
              to: contact.email,
              name: contact.name,
              subject: '🚨 EMERGENCY ALERT',
              message: message,
              location: locationUrl,
              personalInfo: personalInfo || {},
            },
          })
        )
      );
    } catch (error) {
      console.error('Error sending emergency emails:', error);
      throw error;
    }
  };

  // Simplified emergency emails with location, tracking, personal info, and WiFi
  const sendEnhancedEmergencyEmails = async (message: string, contacts: EmailContact[], userId: string) => {
    // Import simplified SOS utilities
    const { captureSimplifiedSOSData } = await import('@/utils/enhancedSOS');
    const { startLocationTracking, generateTrackingUrl } = await import('@/utils/locationTracking');
    const { Device } = await import('@capacitor/device');
    const { Network } = await import('@capacitor/network');
    const { Geolocation } = await import('@capacitor/geolocation');

    try {
      // Get current location
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Fetch personal information
      const { data: personalInfo } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('🚨 SOS TRIGGERED - Capturing WiFi data...');
      
      // Capture simplified SOS data (just WiFi)
      const simplifiedData = await captureSimplifiedSOSData();
      
      // Note: Automatic photo capture is not possible due to platform security restrictions.
      // Camera APIs require explicit user interaction (pressing shutter button) on both iOS and Android.
      
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

      // Create SOS history record
      const { data: sosHistoryData, error: sosHistoryError } = await supabase
        .from('sos_history')
        .insert([{
          user_id: userId,
          latitude,
          longitude,
          message,
          contacts_count: contacts.length,
          contacted_recipients: contacts.map(c => ({
            name: c.name,
            email: c.email,
            timestamp: new Date().toISOString()
          })),
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
        userId: userId,
        durationMinutes: 5
      }).catch(err => console.error('Location tracking error:', err));

      // Generate tracking URL (valid for 5 minutes)
      const trackingUrl = generateTrackingUrl(sosHistoryData.id);
      
      // Send notification to control room
      console.log('Sending email notifications...');
      
      await supabase.functions.invoke('send-sos-notification', {
        body: {
          userId: userId,
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
          contactsNotified: contacts.length,
        }
      });
      
      // Also send to individual email contacts
      for (const contact of contacts) {
        await supabase.functions.invoke('send-emergency-email', {
          body: {
            to: contact.email,
            name: contact.name,
            subject: '🚨 EMERGENCY ALERT',
            message,
            location: locationUrl,
            trackingUrl,
            personalInfo: personalInfo || {},
            wifiInfo: simplifiedData.wifiInfo,
            wifiNames: simplifiedData.wifiNames,
          },
        });
      }
      
    } catch (error) {
      console.error('Error sending emergency emails:', error);
      throw error;
    }
  };

  const { shakeCount } = useShakeDetection({
    threshold: settings.sensitivity,
    requiredShakes: settings.shakeCount,
    resetTime: 3000,
    onShake: handleSOS,
    enabled: settings.enabled,
    cooldownPeriod: settings.cooldownPeriod * 1000, // Convert seconds to milliseconds
  });

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show subscription gate if no access
  if (!hasAccess) {
    return <SubscriptionGate />;
  }

  // Show permissions setup if not completed
  if (!permissionsComplete) {
    return <PermissionsSetup onComplete={handlePermissionsComplete} />;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 pt-6"
        >
          <div className="flex justify-center">
            <motion.img
              src={alfa22Logo}
              alt="Alfa22 Security Logo"
              className="w-32 h-32 object-contain"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-emergency bg-clip-text text-transparent">
              Alfa22 SOS
            </h1>
            <p className="text-muted-foreground">Emergency shake detection system</p>
          </div>
        </motion.div>

        {/* Power Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleToggle}
            size="lg"
            className={`w-32 h-32 rounded-full text-xl font-bold transition-all ${
              settings.enabled
                ? 'bg-primary hover:bg-primary/90 shadow-emergency pulse-glow'
                : 'bg-safe hover:bg-safe/90'
            }`}
          >
            <Power className="w-12 h-12" />
          </Button>
        </motion.div>

        {/* Status */}
        <SOSStatus
          enabled={settings.enabled}
          shakeCount={shakeCount}
          requiredShakes={settings.shakeCount}
        />

        {/* Subscription Status */}
        <SubscriptionStatus
          subscription={subscription}
          loading={subscriptionLoading}
        />

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contacts" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs sm:text-sm">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-1 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <button 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-muted flex gap-1"
              onClick={() => navigate('/history')}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4 mt-6">
            <ContactList
              contacts={settings.contacts}
              onRemove={removeContact}
              onAdd={() => setShowAddContact(true)}
              onTest={handleTestSOS}
            />
            <EmailContactList
              contacts={settings.emailContacts}
              onRemove={removeEmailContact}
              onAdd={() => setShowAddEmailContact(true)}
              onTest={handleTestEmail}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
           <SettingsPanel
             message={settings.message}
             testMessage={settings.testMessage}
             emailMessage={settings.emailMessage}
             testEmailMessage={settings.testEmailMessage}
             sensitivity={settings.sensitivity}
             shakeCount={settings.shakeCount}
             smsTriggerEnabled={settings.smsTriggerEnabled}
             cooldownPeriod={settings.cooldownPeriod}
             onSaveSettings={async (newSettings) => {
               try {
                 console.log('💾 Saving all settings in one operation:', newSettings);

                 await saveAllSettings({
                   ...settings,
                   message: newSettings.message,
                   testMessage: newSettings.testMessage,
                   emailMessage: newSettings.emailMessage,
                   testEmailMessage: newSettings.testEmailMessage,
                   sensitivity: Number(newSettings.sensitivity),
                   shakeCount: Number(newSettings.shakeCount),
                   smsTriggerEnabled: newSettings.smsTriggerEnabled,
                   cooldownPeriod: Number(newSettings.cooldownPeriod),
                 });

                 console.log('✅ All settings saved successfully');

                 toast({
                   title: "Settings Saved",
                   description: "Your settings have been saved successfully",
                 });
               } catch (error) {
                 console.error('❌ Error saving settings:', error);
                 toast({
                   title: "Error",
                   description: "Failed to save settings. Please try again.",
                   variant: "destructive",
                 });
               }
             }}
           />
           </TabsContent>

          <TabsContent value="personal" className="space-y-4 mt-6">
            <PersonalInformation />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <ProfileSettings />
            
            {!adminLoading && isAdmin && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
        onAdd={addContact}
      />

      <AddEmailContactDialog
        open={showAddEmailContact}
        onOpenChange={setShowAddEmailContact}
        onAdd={addEmailContact}
      />
    </div>
  );
};

export default Index;
