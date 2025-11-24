-- Allow public read access to sos_history for live tracking
CREATE POLICY "Public can view sos_history for live tracking"
ON public.sos_history
FOR SELECT
USING (true);

-- Allow public read access to location_tracking for live tracking
CREATE POLICY "Public can view location_tracking"
ON public.location_tracking
FOR SELECT
USING (true);