import { motion } from 'framer-motion';
import { Lock, CreditCard, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';

const PAYFAST_MERCHANT_ID = import.meta.env.VITE_PAYFAST_MERCHANT_ID || '10000100';
const PAYFAST_MERCHANT_KEY = import.meta.env.VITE_PAYFAST_MERCHANT_KEY || '46f0cd694581a';
const PAYFAST_URL = import.meta.env.VITE_PAYFAST_URL || 'https://www.payfast.co.za/eng/process';

export const SubscriptionGate = () => {
  const { subscription, loading, hasAccess } = useSubscription();
  const { user } = useAuth();

  const handleSubscribe = () => {
    if (!user || !subscription) return;

    const amount = (subscription.amount_cents / 100).toFixed(2);
    const returnUrl = `${window.location.origin}/`;
    const cancelUrl = `${window.location.origin}/`;
    const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payfast-webhook`;

    // Build PayFast payment data
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
      item_description: 'Monthly subscription to Alfa22 SOS emergency service',
      custom_str1: user.id, // Pass user_id for webhook
      subscription_type: '1', // Subscription
      billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recurring_amount: amount,
      frequency: '3', // Monthly
      cycles: '0', // Indefinite
    };

    // Create form and submit to PayFast
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (hasAccess) {
    return null; // User has access, don't show gate
  }

  const daysRemaining = subscription 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired' || (isTrial && daysRemaining === 0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 space-y-6 border-2">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {isExpired ? (
                <Lock className="w-8 h-8 text-primary" />
              ) : (
                <Clock className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold">
              {isExpired ? 'Subscription Required' : 'Trial Period'}
            </h1>
            
            {isTrial && !isExpired && (
              <p className="text-muted-foreground">
                You have <span className="font-bold text-primary">{daysRemaining} days</span> remaining in your trial
              </p>
            )}
            
            {isExpired && (
              <p className="text-muted-foreground">
                Your trial has ended. Subscribe to continue using Alfa22 SOS.
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly subscription</span>
              <span className="text-2xl font-bold">R50</span>
            </div>
            
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Emergency SOS alerts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Location tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Multiple emergency contacts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Shake detection
              </li>
            </ul>
          </div>

          <Button
            onClick={handleSubscribe}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Subscribe Now
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by PayFast
          </p>
        </Card>
      </motion.div>
    </div>
  );
};