-- Create function to allow users to cancel their own subscription
CREATE OR REPLACE FUNCTION public.cancel_own_subscription()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Users can only cancel their own subscription
  UPDATE subscriptions
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No subscription found for current user';
  END IF;
END;
$$;