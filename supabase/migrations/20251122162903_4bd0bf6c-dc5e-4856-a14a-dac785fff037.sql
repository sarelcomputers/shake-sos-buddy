-- Create location_tracking table for live tracking
CREATE TABLE public.location_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sos_history_id UUID NOT NULL REFERENCES sos_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

-- Public read policy for emergency contacts (no auth required)
CREATE POLICY "Anyone can view location tracking"
  ON public.location_tracking
  FOR SELECT
  USING (true);

-- Users can insert their own location tracking
CREATE POLICY "Users can insert own location tracking"
  ON public.location_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX idx_location_tracking_sos_history ON public.location_tracking(sos_history_id);
CREATE INDEX idx_location_tracking_timestamp ON public.location_tracking(timestamp DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_tracking;