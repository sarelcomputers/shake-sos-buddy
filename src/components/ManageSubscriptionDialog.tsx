import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  currentStatus?: string;
  onSuccess: () => void;
}

export const ManageSubscriptionDialog = ({
  open,
  onOpenChange,
  userId,
  userEmail,
  currentStatus,
  onSuccess,
}: ManageSubscriptionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [trialDays, setTrialDays] = useState<number>(30);
  const [freeDays, setFreeDays] = useState<number>(30);

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_subscription_status', {
        _user_id: userId,
        _status: newStatus,
      });

      if (error) throw error;

      toast.success('Status updated', {
        description: `Subscription status changed to ${newStatus}`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (trialDays < 1 || trialDays > 365) {
      toast.error('Please enter a valid number of days (1-365)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('extend_trial', {
        _user_id: userId,
        _days: trialDays,
      });

      if (error) throw error;

      toast.success('Trial extended', {
        description: `Added ${trialDays} days to trial period`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('Failed to extend trial');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantFreeAccess = async () => {
    if (freeDays < 1 || freeDays > 365) {
      toast.error('Please enter a valid number of days (1-365)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('grant_free_access', {
        _user_id: userId,
        _days: freeDays,
      });

      if (error) throw error;

      toast.success('Free access granted', {
        description: `Granted ${freeDays} days of free access`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error granting free access:', error);
      toast.error('Failed to grant free access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <DialogDescription>
            Manage subscription for {userEmail}
            {currentStatus && (
              <span className="ml-2 text-xs font-medium px-2 py-1 bg-muted rounded">
                Current: {currentStatus}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">
              <CheckCircle className="w-4 h-4 mr-1" />
              Status
            </TabsTrigger>
            <TabsTrigger value="trial">
              <Calendar className="w-4 h-4 mr-1" />
              Trial
            </TabsTrigger>
            <TabsTrigger value="free">
              <Gift className="w-4 h-4 mr-1" />
              Free
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Manually change the subscription status
              </p>
            </div>

            <Button
              onClick={handleUpdateStatus}
              disabled={loading || !newStatus}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </TabsContent>

          <TabsContent value="trial" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Extend Trial (Days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 30)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Add additional days to the existing trial period (1-365 days)
              </p>
            </div>

            <Button
              onClick={handleExtendTrial}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Extending...' : `Extend Trial by ${trialDays} Days`}
            </Button>
          </TabsContent>

          <TabsContent value="free" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Grant Free Access (Days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={freeDays}
                onChange={(e) => setFreeDays(parseInt(e.target.value) || 30)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Grant free active subscription for specified days (no payment required)
              </p>
            </div>

            <div className="bg-muted/50 border rounded-lg p-3">
              <p className="text-sm font-medium mb-1">This will:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Set status to "active"</li>
                <li>Set amount to R0.00</li>
                <li>Grant access for {freeDays} days</li>
              </ul>
            </div>

            <Button
              onClick={handleGrantFreeAccess}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Granting...' : `Grant ${freeDays} Days Free Access`}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};