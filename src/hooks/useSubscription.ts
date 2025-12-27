import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  payfast_token: string | null;
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        // First check if user is admin - admins get full access
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          setIsAdmin(true);
          setHasAccess(true);
          // Still fetch subscription for display purposes
        }

        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching subscription:', error);
          // If admin, still grant access even if subscription fetch fails
          if (roleData) {
            setHasAccess(true);
          }
          setLoading(false);
          return;
        }

        if (!data) {
          // Create initial trial subscription
          const { data: newSub, error: createError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              status: 'trial',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating subscription:', createError);
            // If admin, still grant access
            if (roleData) {
              setHasAccess(true);
            }
            setLoading(false);
            return;
          }

          setSubscription(newSub as Subscription);
          setHasAccess(true);
        } else {
          setSubscription(data as Subscription);
          
          // Admin users always have access
          if (roleData) {
            setHasAccess(true);
          } else {
            // Check if user has access based on subscription
            const now = new Date();
            const trialEnds = new Date(data.trial_ends_at);
            const periodEnds = data.current_period_end ? new Date(data.current_period_end) : null;

            const inTrial = data.status === 'trial' && now < trialEnds;
            const activeSubscription = data.status === 'active' && periodEnds && now < periodEnds;

            setHasAccess(inTrial || activeSubscription);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Subscription fetch error:', error);
        setLoading(false);
      }
    };

    fetchSubscription();

    // Set up realtime subscription
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription changed:', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { subscription, loading, hasAccess, isAdmin };
};