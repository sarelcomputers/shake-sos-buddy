-- Drop the public access policy that exposes all location data
DROP POLICY IF EXISTS "Anyone can view location tracking" ON public.location_tracking;

-- Allow users to view only their own location tracking data
CREATE POLICY "Users can view own location tracking"
ON public.location_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins (emergency responders) to view all location tracking data
CREATE POLICY "Admins can view all location tracking"
ON public.location_tracking
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));