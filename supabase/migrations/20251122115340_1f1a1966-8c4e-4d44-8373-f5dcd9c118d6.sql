-- Update subscriptions policies to allow admin management
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );

-- Admins can update any subscription
CREATE POLICY "Admins can update any subscription"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Function to extend trial
CREATE OR REPLACE FUNCTION public.extend_trial(
  _user_id UUID,
  _days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can extend trials';
  END IF;

  UPDATE subscriptions
  SET 
    trial_ends_at = trial_ends_at + (_days || ' days')::interval,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Function to grant free access
CREATE OR REPLACE FUNCTION public.grant_free_access(
  _user_id UUID,
  _days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant free access';
  END IF;

  UPDATE subscriptions
  SET 
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + (_days || ' days')::interval,
    amount_cents = 0,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  _user_id UUID,
  _status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update subscription status';
  END IF;

  -- Validate status
  IF _status NOT IN ('trial', 'active', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE subscriptions
  SET 
    status = _status::TEXT,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;