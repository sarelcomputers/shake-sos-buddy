import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Gauge, Hash, Volume2, AlertCircle, Shield, Mail, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  message: string;
  testMessage: string;
  emailMessage: string;
  testEmailMessage: string;
  sensitivity: number;
  shakeCount: number;
  voiceAlertEnabled: boolean;
  voicePassword: string;
  smsTriggerEnabled: boolean;
  cooldownPeriod: number;
  onSaveSettings: (settings: {
    message: string;
    testMessage: string;
    emailMessage: string;
    testEmailMessage: string;
    sensitivity: number;
    shakeCount: number;
    voiceAlertEnabled: boolean;
    voicePassword: string;
    smsTriggerEnabled: boolean;
    cooldownPeriod: number;
  }) => void;
}

export const SettingsPanel = ({
  message,
  testMessage,
  emailMessage,
  testEmailMessage,
  sensitivity,
  shakeCount,
  voiceAlertEnabled,
  voicePassword,
  smsTriggerEnabled,
  cooldownPeriod,
  onSaveSettings,
}: SettingsPanelProps) => {
  // Local state for unsaved changes
  const [localMessage, setLocalMessage] = useState(message);
  const [localTestMessage, setLocalTestMessage] = useState(testMessage);
  const [localEmailMessage, setLocalEmailMessage] = useState(emailMessage);
  const [localTestEmailMessage, setLocalTestEmailMessage] = useState(testEmailMessage);
  const [localSensitivity, setLocalSensitivity] = useState(sensitivity);
  const [localShakeCount, setLocalShakeCount] = useState(shakeCount);
  const [localVoiceAlertEnabled, setLocalVoiceAlertEnabled] = useState(voiceAlertEnabled);
  const [localVoicePassword, setLocalVoicePassword] = useState(voicePassword);
  const [localSmsTriggerEnabled, setLocalSmsTriggerEnabled] = useState(smsTriggerEnabled);
  const [localCooldownPeriod, setLocalCooldownPeriod] = useState(cooldownPeriod);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync props to local state when they change from external source
  useEffect(() => {
    setLocalMessage(message);
    setLocalTestMessage(testMessage);
    setLocalEmailMessage(emailMessage);
    setLocalTestEmailMessage(testEmailMessage);
    setLocalSensitivity(sensitivity);
    setLocalShakeCount(shakeCount);
    setLocalVoiceAlertEnabled(voiceAlertEnabled);
    setLocalVoicePassword(voicePassword);
    setLocalSmsTriggerEnabled(smsTriggerEnabled);
    setLocalCooldownPeriod(cooldownPeriod);
  }, [message, testMessage, emailMessage, testEmailMessage, sensitivity, shakeCount, voiceAlertEnabled, voicePassword, smsTriggerEnabled, cooldownPeriod]);

  // Check for unsaved changes
  useEffect(() => {
    const changed = 
      localMessage !== message ||
      localTestMessage !== testMessage ||
      localEmailMessage !== emailMessage ||
      localTestEmailMessage !== testEmailMessage ||
      localSensitivity !== sensitivity ||
      localShakeCount !== shakeCount ||
      localVoiceAlertEnabled !== voiceAlertEnabled ||
      localVoicePassword !== voicePassword ||
      localSmsTriggerEnabled !== smsTriggerEnabled ||
      localCooldownPeriod !== cooldownPeriod;
    
    setHasUnsavedChanges(changed);
  }, [localMessage, localTestMessage, localEmailMessage, localTestEmailMessage, localSensitivity, localShakeCount, localVoiceAlertEnabled, localVoicePassword, localSmsTriggerEnabled, localCooldownPeriod, message, testMessage, emailMessage, testEmailMessage, sensitivity, shakeCount, voiceAlertEnabled, voicePassword, smsTriggerEnabled, cooldownPeriod]);

  const handleSave = () => {
    onSaveSettings({
      message: localMessage,
      testMessage: localTestMessage,
      emailMessage: localEmailMessage,
      testEmailMessage: localTestEmailMessage,
      sensitivity: localSensitivity,
      shakeCount: localShakeCount,
      voiceAlertEnabled: localVoiceAlertEnabled,
      voicePassword: localVoicePassword,
      smsTriggerEnabled: localSmsTriggerEnabled,
      cooldownPeriod: localCooldownPeriod,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Settings</h3>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <Label htmlFor="smsTrigger" className="text-base font-semibold">
                  SMS Emergency Alerts
                </Label>
              </div>
              <Switch
                id="smsTrigger"
                checked={localSmsTriggerEnabled}
                onCheckedChange={setLocalSmsTriggerEnabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enable or disable SMS alerts when SOS is triggered
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <Label htmlFor="voiceAlert" className="text-base font-semibold">
                  Voice Alert
                </Label>
              </div>
              <Switch
                id="voiceAlert"
                checked={localVoiceAlertEnabled}
                onCheckedChange={setLocalVoiceAlertEnabled}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Enable voice activation for SOS alerts
              </p>
              {localVoiceAlertEnabled && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your device will stay awake (screen may dim) to continuously listen for your password. This uses more battery but works even when screen is locked.
                  </p>
                </div>
              )}
            </div>
            
            {localVoiceAlertEnabled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Label htmlFor="voicePassword" className="text-sm font-medium">
                    Voice Alert Password
                  </Label>
                </div>
                <Input
                  id="voicePassword"
                  type="text"
                  value={localVoicePassword}
                  onChange={(e) => setLocalVoicePassword(e.target.value)}
                  placeholder="e.g., help me now"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Say this password when armed to activate voice confirmation. Device will ask "Do you need help?" - say "yes" to trigger alert or "no" to cancel.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label htmlFor="message" className="text-base font-semibold">
                Emergency Message (SMS)
              </Label>
            </div>
            <Textarea
              id="message"
              value={localMessage}
              onChange={(e) => setLocalMessage(e.target.value)}
              placeholder="Enter your emergency SMS message..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent via SMS with your location
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label htmlFor="testMessage" className="text-base font-semibold">
                Test Message (SMS)
              </Label>
            </div>
            <Textarea
              id="testMessage"
              value={localTestMessage}
              onChange={(e) => setLocalTestMessage(e.target.value)}
              placeholder="Enter your test SMS message..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent when you test an SMS contact
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label htmlFor="emailMessage" className="text-base font-semibold">
                Emergency Message (Email)
              </Label>
            </div>
            <Textarea
              id="emailMessage"
              value={localEmailMessage}
              onChange={(e) => setLocalEmailMessage(e.target.value)}
              placeholder="Enter your emergency email message..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent via email with your location and personal info
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label htmlFor="testEmailMessage" className="text-base font-semibold">
                Test Message (Email)
              </Label>
            </div>
            <Textarea
              id="testEmailMessage"
              value={localTestEmailMessage}
              onChange={(e) => setLocalTestEmailMessage(e.target.value)}
              placeholder="Enter your test email message..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent when you test an email contact
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <Label htmlFor="sensitivity" className="text-base font-semibold">
                Shake Sensitivity: {35 - localSensitivity}
              </Label>
            </div>
            <Slider
              id="sensitivity"
              value={[35 - localSensitivity]}
              onValueChange={([value]) => setLocalSensitivity(35 - value)}
              min={5}
              max={30}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Less sensitive</span>
              <span>More sensitive</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              <Label htmlFor="shakeCount" className="text-base font-semibold">
                Required Shakes
              </Label>
            </div>
            <Input
              id="shakeCount"
              type="number"
              value={localShakeCount}
              onChange={(e) => setLocalShakeCount(parseInt(e.target.value) || 5)}
              onFocus={(e) => e.target.select()}
              min={2}
              max={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of shakes needed to trigger the alert (2-10)
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <Label htmlFor="cooldownPeriod" className="text-base font-semibold">
                Alert Cooldown: {localCooldownPeriod}s
              </Label>
            </div>
            <Slider
              id="cooldownPeriod"
              value={[localCooldownPeriod]}
              onValueChange={([value]) => setLocalCooldownPeriod(value)}
              min={0}
              max={300}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No cooldown</span>
              <span>5 minutes</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Waiting period after an alert before the next one can trigger (0 = no cooldown)
            </p>
          </div>

          {hasUnsavedChanges && (
            <div className="pt-6 border-t">
              <Button 
                onClick={handleSave}
                className="w-full"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You have unsaved changes
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
