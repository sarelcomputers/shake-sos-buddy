import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Settings as SettingsIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SOSStatus } from '@/components/SOSStatus';
import { ContactList } from '@/components/ContactList';
import { SettingsPanel } from '@/components/SettingsPanel';
import { AddContactDialog } from '@/components/AddContactDialog';
import { useSOSSettings } from '@/hooks/useSOSSettings';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import { sendSOSMessages } from '@/utils/sms';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const {
    settings,
    toggleEnabled,
    updateMessage,
    updateSensitivity,
    updateShakeCount,
    addContact,
    removeContact,
  } = useSOSSettings();

  const [showAddContact, setShowAddContact] = useState(false);

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

      await sendSOSMessages(settings.message, settings.contacts);
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

  const { shakeCount } = useShakeDetection({
    threshold: settings.sensitivity,
    requiredShakes: settings.shakeCount,
    resetTime: 3000,
    onShake: handleSOS,
    enabled: settings.enabled,
  });

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2 pt-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-emergency bg-clip-text text-transparent">
            Alfa22 SOS
          </h1>
          <p className="text-muted-foreground">Emergency shake detection system</p>
        </motion.div>

        {/* Power Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={toggleEnabled}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4 mt-6">
            <ContactList
              contacts={settings.contacts}
              onRemove={removeContact}
              onAdd={() => setShowAddContact(true)}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-6">
            <SettingsPanel
              message={settings.message}
              sensitivity={settings.sensitivity}
              shakeCount={settings.shakeCount}
              onMessageChange={updateMessage}
              onSensitivityChange={updateSensitivity}
              onShakeCountChange={updateShakeCount}
            />
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
