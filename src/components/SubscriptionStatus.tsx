import { motion } from 'framer-motion';
import { CreditCard, Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Subscription } from '@/hooks/useSubscription';
import { formatDistanceToNow } from 'date-fns';

interface SubscriptionStatusProps {
  subscription: Subscription | null;
  loading: boolean;
}

export const SubscriptionStatus = ({ subscription, loading }: SubscriptionStatusProps) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full"
      >
        <Card className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusInfo = () => {
    const now = new Date();
    const trialEnds = new Date(subscription.trial_ends_at);
    const periodEnds = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

    switch (subscription.status) {
      case 'trial':
        const isTrialActive = now < trialEnds;
        return {
          label: 'Trial',
          icon: Calendar,
          variant: isTrialActive ? 'default' : 'destructive',
          message: isTrialActive 
            ? `Trial ends ${formatDistanceToNow(trialEnds, { addSuffix: true })}`
            : 'Trial expired',
          color: isTrialActive ? 'text-blue-500' : 'text-destructive',
        };
      
      case 'active':
        const isActive = periodEnds && now < periodEnds;
        return {
          label: 'Active',
          icon: CheckCircle,
          variant: 'default',
          message: isActive && periodEnds
            ? `Renews ${formatDistanceToNow(periodEnds, { addSuffix: true })}`
            : 'Active subscription',
          color: 'text-green-500',
        };
      
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: XCircle,
          variant: 'secondary',
          message: periodEnds
            ? `Access until ${formatDistanceToNow(periodEnds, { addSuffix: true })}`
            : 'Subscription cancelled',
          color: 'text-muted-foreground',
        };
      
      case 'expired':
        return {
          label: 'Expired',
          icon: AlertCircle,
          variant: 'destructive',
          message: 'Subscription expired',
          color: 'text-destructive',
        };
      
      default:
        return {
          label: 'Unknown',
          icon: AlertCircle,
          variant: 'secondary',
          message: 'Status unknown',
          color: 'text-muted-foreground',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const amount = subscription.amount_cents / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full"
    >
      <Card className="p-4 border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0`} />
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusInfo.variant as any} className="text-xs">
                  {statusInfo.label}
                </Badge>
                {subscription.status === 'active' && (
                  <span className="text-xs font-medium text-muted-foreground">
                    R{amount.toFixed(2)}/month
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {statusInfo.message}
              </p>
            </div>
          </div>
          <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    </motion.div>
  );
};
