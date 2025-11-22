import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Settings as SettingsIcon, Users, UserCircle, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOSStatus } from '@/components/SOSStatus';
import { ContactList } from '@/components/ContactList';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ProfileSettings } from '@/components/ProfileSettings';
import { AddContactDialog } from '@/components/AddContactDialog';
import { useSOSSettings, type Contact } from '@/hooks/useSOSSettings';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useAuth } from '@/hooks/useAuth';
import { sendSOSMessages } from '@/utils/sms';
import { toast } from '@/hooks/use-toast';
import alfa22Logo from '@/assets/alfa22-logo.png';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    settings,
    loading,
    toggleEnabled,
    updateMessage,
    updateTestMessage,
    updateSensitivity,
    updateShakeCount,
    addContact,
    removeContact,
  } = useSOSSettings();

  const [showAddContact, setShowAddContact] = useState(false);

  const handleToggle = () => {
    const willBeEnabled = !settings.enabled;
    toggleEnabled();
    
    if (willBeEnabled) {
      toast({
        title: "System Armed ✓",
        description: "Device will stay awake and monitor for shakes even when screen is locked",
        duration: 5000,
      });
    } else {
      toast({
        title: "System Disarmed",
        description: "Shake detection disabled",
      });
    }
  };

  const handleSOS = async () => {
    try {
      if (settings.contacts.length === 0) {
        toast({
          title: "No contacts added",
          description: "Please add emergency contacts before activating SOS",
          variant: "destructive",
        });
        return;
      }

      await sendSOSMessages(settings.message, settings.contacts, user?.id);
      toast({
        title: "SOS Sent!",
        description: "Emergency messages sent to all contacts",
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
        description: `Test SOS sent to ${contact.name}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not send test message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { shakeCount } = useShakeDetection({
    threshold: settings.sensitivity,
    requiredShakes: settings.shakeCount,
    resetTime: 3000,
    onShake: handleSOS,
    enabled: settings.enabled,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2"
              onClick={() => navigate('/history')}
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4 mt-6">
            <ContactList
              contacts={settings.contacts}
              onRemove={removeContact}
              onAdd={() => setShowAddContact(true)}
              onTest={handleTestSOS}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <SettingsPanel
              message={settings.message}
              testMessage={settings.testMessage}
              sensitivity={settings.sensitivity}
              shakeCount={settings.shakeCount}
              onMessageChange={updateMessage}
              onTestMessageChange={updateTestMessage}
              onSensitivityChange={updateSensitivity}
              onShakeCountChange={updateShakeCount}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-6">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>

      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
        onAdd={addContact}
      />
    </div>
  );
};

export default Index;
