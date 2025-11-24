-- Fix RLS policies for public access to live tracking
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to sos_history" ON public.sos_history;
DROP POLICY IF EXISTS "Allow public read access to location_tracking" ON public.location_tracking;

-- Enable RLS
ALTER TABLE public.sos_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies that allow anyone (including anon) to read live tracking data
CREATE POLICY "Allow public read access to sos_history"
  ON public.sos_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to location_tracking"
  ON public.location_tracking
  FOR SELECT
  TO anon, authenticated
  USING (true);