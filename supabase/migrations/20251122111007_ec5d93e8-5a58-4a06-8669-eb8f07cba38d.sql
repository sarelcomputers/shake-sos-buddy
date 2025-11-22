-- Fix function search_path security warning
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record
  FROM public.subscriptions
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if in trial period
  IF sub_record.status = 'trial' AND sub_record.trial_ends_at > now() THEN
    RETURN true;
  END IF;
  
  -- Check if subscription is active and not expired
  IF sub_record.status = 'active' AND 
     sub_record.current_period_end IS NOT NULL AND 
     sub_record.current_period_end > now() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;