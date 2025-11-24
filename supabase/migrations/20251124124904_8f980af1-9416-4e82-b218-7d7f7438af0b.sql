-- Create table to track device registrations
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_model TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own device registrations
CREATE POLICY "Users can view own device registrations"
  ON public.device_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow anyone to check if a device exists (needed for signup validation)
CREATE POLICY "Anyone can check device existence"
  ON public.device_registrations
  FOR SELECT
  USING (true);

-- Allow users to insert their own device registration
CREATE POLICY "Users can insert own device registration"
  ON public.device_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_device_registrations_device_id ON public.device_registrations(device_id);