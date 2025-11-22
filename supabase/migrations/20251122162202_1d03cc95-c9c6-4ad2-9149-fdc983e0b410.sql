-- Create emergency_emails table
CREATE TABLE public.emergency_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for emergency_emails
CREATE POLICY "Users can view own emergency emails"
  ON public.emergency_emails
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency emails"
  ON public.emergency_emails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency emails"
  ON public.emergency_emails
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency emails"
  ON public.emergency_emails
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add email_message to sos_settings
ALTER TABLE public.sos_settings
ADD COLUMN email_message TEXT NOT NULL DEFAULT 'EMERGENCY ALERT! I need immediate help at this location.';

-- Add test_email_message to sos_settings
ALTER TABLE public.sos_settings
ADD COLUMN test_email_message TEXT NOT NULL DEFAULT '[TEST] This is a test of your emergency email alert system. No action needed.';