-- Fix subscription security - remove overly permissive policies
DROP POLICY IF EXISTS "System can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can update any subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;

-- Users can only view their own subscription (read-only)
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can create their own subscription (initial trial)
CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ONLY admins can update subscriptions (no user self-updates allowed)
CREATE POLICY "Only admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ONLY admins can delete subscriptions
CREATE POLICY "Only admins can delete subscriptions"
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));