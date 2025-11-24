-- Allow anyone with the tracking link to view SOS history for emergency response
CREATE POLICY "Anyone can view SOS history for emergency response"
  ON public.sos_history
  FOR SELECT
  USING (true);

-- The location_tracking table already has a public policy, but let's ensure it's clear
-- Policy "Anyone can view location tracking for emergency response" already exists