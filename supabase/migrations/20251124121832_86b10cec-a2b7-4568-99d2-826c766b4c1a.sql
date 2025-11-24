-- Allow public access to location tracking data for emergency contacts
-- This is critical for life-or-death situations where emergency contacts need to track location
CREATE POLICY "Anyone can view location tracking for emergency response"
ON public.location_tracking
FOR SELECT
USING (true);