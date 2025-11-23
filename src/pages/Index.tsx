import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, Settings as SettingsIcon, Users, UserCircle, History, Shield, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOSStatus } from '@/components/SOSStatus';
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
import { checkBackgroundSOSTrigger } from '@/utils/backgroundRunner';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, loading: subscriptionLoading } = useSubscription();
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
    addContact,
    removeContact,
    addEmailContact,
    removeEmailContact,
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

  // Check for background SOS triggers when app is reopened
  useEffect(() => {
    if (!settings.enabled || !Capacitor.isNativePlatform()) return;
    
    const checkInterval = setInterval(async () => {
      const shouldTrigger = await checkBackgroundSOSTrigger();
      if (shouldTrigger) {
        console.log('Background runner triggered SOS!');
        await handleSOS();
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(checkInterval);
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
    
    if (willBeEnabled) {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      
      toast({
        title: "System Armed ✓",
        description: isNative 
          ? `Background monitoring enabled. App will listen for shakes even when closed${platform === 'ios' ? ' (keep app in foreground on iOS)' : ''}.`
          : "Device will stay awake and monitor for shakes even when screen is locked",
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

      // Send SMS if contacts exist
      if (settings.contacts.length > 0) {
        await sendSOSMessages(settings.message, settings.contacts, user?.id);
      }

      // Send emails if email contacts exist
      if (settings.emailContacts.length > 0 && user?.id) {
        await sendEmergencyEmails(settings.emailMessage, settings.emailContacts, user.id);
      }

      toast({
        title: "SOS Sent!",
        description: "Emergency alerts sent to all contacts",
      });
    } catch (error) {
      toast({
        title: "Failed to send SOS",
        description: "Please check your permissions and try again",
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

  const { shakeCount } = useShakeDetection({
    threshold: settings.sensitivity,
    requiredShakes: settings.shakeCount,
    resetTime: 3000,
    onShake: handleSOS,
    enabled: settings.enabled,
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

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
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
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-1 text-xs sm:text-sm"
              onClick={() => navigate('/history')}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            {!adminLoading && isAdmin && (
              <TabsTrigger 
                value="control-room" 
                className="flex items-center gap-1 text-xs sm:text-sm"
                onClick={() => navigate('/control-room')}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Control</span>
              </TabsTrigger>
            )}
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
              onMessageChange={updateMessage}
              onTestMessageChange={updateTestMessage}
              onEmailMessageChange={updateEmailMessage}
              onTestEmailMessageChange={updateTestEmailMessage}
              onSensitivityChange={updateSensitivity}
              onShakeCountChange={updateShakeCount}
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
