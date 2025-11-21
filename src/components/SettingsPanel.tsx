import { motion } from 'framer-motion';
import { MessageSquare, Gauge, Hash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface SettingsPanelProps {
  message: string;
  sensitivity: number;
  shakeCount: number;
  onMessageChange: (message: string) => void;
  onSensitivityChange: (sensitivity: number) => void;
  onShakeCountChange: (count: number) => void;
}

export const SettingsPanel = ({
  message,
  sensitivity,
  shakeCount,
  onMessageChange,
  onSensitivityChange,
  onShakeCountChange,
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label htmlFor="message" className="text-base font-semibold">
                Emergency Message
              </Label>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Enter your emergency message..."
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your location will be automatically added to this message
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <Label htmlFor="sensitivity" className="text-base font-semibold">
                Shake Sensitivity: {sensitivity}
              </Label>
            </div>
            <Slider
              id="sensitivity"
              value={[sensitivity]}
              onValueChange={([value]) => onSensitivityChange(value)}
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
              onChange={(e) => onShakeCountChange(parseInt(e.target.value) || 3)}
              min={2}
              max={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of shakes needed to trigger the alert (2-10)
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
