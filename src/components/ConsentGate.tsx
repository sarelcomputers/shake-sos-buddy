import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ConsentDialog } from './ConsentDialog';

interface ConsentGateProps {
  children: React.ReactNode;
}

export const ConsentGate = ({ children }: ConsentGateProps) => {
  const { user } = useAuth();
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('consent_given')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setConsentGiven(data?.consent_given ?? false);
      } catch (error) {
        console.error('Error checking consent:', error);
        setConsentGiven(false);
      } finally {
        setLoading(false);
      }
    };

    checkConsent();
  }, [user]);

  const handleConsent = () => {
    setConsentGiven(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!consentGiven) {
    return <ConsentDialog open={true} onConsent={handleConsent} />;
  }

  return <>{children}</>;
};