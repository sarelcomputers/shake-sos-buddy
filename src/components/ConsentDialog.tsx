import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, MapPin, Bell, Database, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConsentDialogProps {
  open: boolean;
  onConsent: () => void;
}

export const ConsentDialog = ({ open, onConsent }: ConsentDialogProps) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToLocation, setAgreedToLocation] = useState(false);
  const [agreedToNotifications, setAgreedToNotifications] = useState(false);
  const [agreedToData, setAgreedToData] = useState(false);
  const [loading, setLoading] = useState(false);

  const allAgreed = agreedToTerms && agreedToLocation && agreedToNotifications && agreedToData;

  const handleConsent = async () => {
    if (!allAgreed) {
      toast.error('Please accept all terms to continue');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in first');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          consent_given: true,
          consent_date: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Consent saved successfully');
      onConsent();
    } catch (error: any) {
      console.error('Error saving consent:', error);
      toast.error('Failed to save consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <DialogTitle className="text-2xl">Welcome to Shake SOS Buddy</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Before you begin, please review and accept our terms of service and privacy practices.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Terms of Service */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Terms of Service</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    By using Shake SOS Buddy, you agree to our terms of service. This app is designed for emergency situations and should not be relied upon as the sole means of emergency communication. Always call emergency services (911 or local equivalent) in life-threatening situations.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I have read and agree to the Terms of Service
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Tracking */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Location Tracking</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This app collects and shares your precise location data when you trigger an SOS alert. Location tracking continues for 5 minutes after an alert to help emergency contacts locate you. Your location data is stored securely and only shared with your designated emergency contacts during alerts.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="location"
                      checked={agreedToLocation}
                      onCheckedChange={(checked) => setAgreedToLocation(checked as boolean)}
                    />
                    <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I consent to location tracking during emergencies
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Notifications */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Emergency Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    When you trigger an SOS alert, SMS messages and emails will be sent to your emergency contacts containing your location, personal information, and emergency message. You are responsible for ensuring your emergency contacts consent to receiving these notifications.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="notifications"
                      checked={agreedToNotifications}
                      onCheckedChange={(checked) => setAgreedToNotifications(checked as boolean)}
                    />
                    <label htmlFor="notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I consent to sending emergency notifications to my contacts
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Collection and Storage */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Data Collection & Storage</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    We collect and store: personal information (name, medical details, emergency contacts), location history during alerts, device information, and SOS alert history. Your data is encrypted and stored securely. You can delete your data at any time by deleting your account.
                  </p>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="data"
                      checked={agreedToData}
                      onCheckedChange={(checked) => setAgreedToData(checked as boolean)}
                    />
                    <label htmlFor="data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      I consent to data collection and storage as described
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            By accepting, you confirm you are 18+ years old and have the legal capacity to enter this agreement.
          </p>
          <Button
            onClick={handleConsent}
            disabled={!allAgreed || loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Saving...' : 'Accept & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};