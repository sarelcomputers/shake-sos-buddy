import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAYFAST_MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID || '10000100';
const PAYFAST_MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '46f0cd694581a';
const PAYFAST_URL = import.meta.env.VITE_PAYFAST_URL || 'https://sandbox.payfast.co.za/eng/process';

export default function Subscription() {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  const { user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'trial':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cancelled':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'trial':
        return <Calendar className="w-5 h-5" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success('Subscription cancelled', {
        description: 'Your subscription has been cancelled successfully',
      });
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel', {
        description: 'Could not cancel subscription. Please try again.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleUpdatePayment = () => {
    if (!user || !subscription) return;

    const amount = (subscription.amount_cents / 100).toFixed(2);
    const returnUrl = `${window.location.origin}/subscription`;
    const cancelUrl = `${window.location.origin}/subscription`;
    const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payfast-webhook`;

    const paymentData = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: user.email?.split('@')[0] || 'User',
      email_address: user.email || '',
      m_payment_id: subscription.id,
      amount: amount,
      item_name: 'Alfa22 SOS Monthly Subscription',
      item_description: 'Update payment method for monthly subscription',
      custom_str1: user.id,
      subscription_type: '1',
      billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recurring_amount: amount,
      frequency: '3',
      cycles: '0',
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYFAST_URL;

    Object.entries(paymentData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No Subscription Found</h2>
          <p className="text-muted-foreground mb-4">
            You don't have an active subscription yet.
          </p>
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const trialEnds = new Date(subscription.trial_ends_at);
  const periodEnds = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const daysRemaining = subscription.status === 'trial' 
    ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : periodEnds 
    ? Math.max(0, Math.ceil((periodEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 pt-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground">Manage your billing and subscription</p>
          </div>
        </motion.div>

        {/* Current Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Current Plan</h2>
                  <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1.5`}>
                    {getStatusIcon(subscription.status)}
                    {subscription.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-primary">
                  R{(subscription.amount_cents / 100).toFixed(2)}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
              </div>
              <CreditCard className="w-12 h-12 text-muted-foreground" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {subscription.status === 'trial' ? 'Trial ends' : 'Next billing date'}
                </p>
                <p className="font-semibold">
                  {subscription.status === 'trial'
                    ? format(trialEnds, 'PPP')
                    : periodEnds
                    ? format(periodEnds, 'PPP')
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Days remaining</p>
                <p className="font-semibold">{daysRemaining} days</p>
              </div>
            </div>

            {subscription.status === 'trial' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  You're currently on a free trial. Subscribe before it ends to continue using Alfa22 SOS.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Manage Subscription</h3>
            <div className="space-y-3">
              {subscription.status === 'active' && (
                <>
                  <Button
                    onClick={handleUpdatePayment}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button
                    onClick={() => setShowCancelDialog(true)}
                    variant="outline"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:border-red-500"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </>
              )}
              
              {(subscription.status === 'trial' || subscription.status === 'expired' || subscription.status === 'cancelled') && (
                <Button
                  onClick={handleUpdatePayment}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscribe Now
                </Button>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Billing History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {subscription.status === 'trial' ? 'Trial Period' : 'Monthly Subscription'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Started {format(new Date(subscription.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {subscription.status === 'trial' ? 'R0.00' : `R${(subscription.amount_cents / 100).toFixed(2)}`}
                  </p>
                  <Badge className={getStatusColor(subscription.status)} variant="outline">
                    {subscription.status}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features Included */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Features Included</h3>
            <ul className="space-y-3">
              {['Emergency SOS alerts', 'Location tracking', 'Multiple emergency contacts', 'Shake detection', '24/7 Support'].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to all features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-500 hover:bg-red-600"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}