import { motion } from 'framer-motion';
import { MessageSquare, Gauge, Hash, Volume2, AlertCircle, Shield, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
  onMessageChange: (message: string) => void;
  onTestMessageChange: (message: string) => void;
  onEmailMessageChange: (message: string) => void;
  onTestEmailMessageChange: (message: string) => void;
  onSensitivityChange: (sensitivity: number) => void;
  onShakeCountChange: (count: number) => void;
  onVoiceAlertEnabledChange: (enabled: boolean) => void;
  onVoicePasswordChange: (password: string) => void;
  onSmsTriggerEnabledChange: (enabled: boolean) => void;
  onCooldownPeriodChange: (period: number) => void;
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
  onMessageChange,
  onTestMessageChange,
  onEmailMessageChange,
  onTestEmailMessageChange,
  onSensitivityChange,
  onShakeCountChange,
  onVoiceAlertEnabledChange,
  onVoicePasswordChange,
  onSmsTriggerEnabledChange,
  onCooldownPeriodChange,
}: SettingsPanelProps) => {
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
                checked={smsTriggerEnabled}
                onCheckedChange={onSmsTriggerEnabledChange}
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
                checked={voiceAlertEnabled}
                onCheckedChange={onVoiceAlertEnabledChange}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Enable voice activation for SOS alerts
              </p>
              {voiceAlertEnabled && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Your device will stay awake (screen may dim) to continuously listen for your password. This uses more battery but works even when screen is locked.
                  </p>
                </div>
              )}
            </div>
            
            {voiceAlertEnabled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Label htmlFor="voicePassword" className="text-sm font-medium">
                    Voice Alert Password
                  </Label>
                </div>
                <Input
                  id="voicePassword"
                  type="text"
                  value={voicePassword}
                  onChange={(e) => onVoicePasswordChange(e.target.value)}
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
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
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
              value={testMessage}
              onChange={(e) => onTestMessageChange(e.target.value)}
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
              value={emailMessage}
              onChange={(e) => onEmailMessageChange(e.target.value)}
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
              value={testEmailMessage}
              onChange={(e) => onTestEmailMessageChange(e.target.value)}
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
                Shake Sensitivity: {35 - sensitivity}
              </Label>
            </div>
            <Slider
              id="sensitivity"
              value={[35 - sensitivity]}
              onValueChange={([value]) => onSensitivityChange(35 - value)}
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
              value={shakeCount}
              onChange={(e) => onShakeCountChange(parseInt(e.target.value) || 5)}
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
                Alert Cooldown: {cooldownPeriod}s
              </Label>
            </div>
            <Slider
              id="cooldownPeriod"
              value={[cooldownPeriod]}
              onValueChange={([value]) => onCooldownPeriodChange(value)}
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

        </Card>
      </motion.div>
    </div>
  );
};
