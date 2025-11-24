-- Create emergency_telegram table
CREATE TABLE IF NOT EXISTS public.emergency_telegram (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_telegram ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own Telegram contacts"
  ON public.emergency_telegram
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Telegram contacts"
  ON public.emergency_telegram
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Telegram contacts"
  ON public.emergency_telegram
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Telegram contacts"
  ON public.emergency_telegram
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add Telegram message fields to sos_settings
ALTER TABLE public.sos_settings 
ADD COLUMN IF NOT EXISTS telegram_message TEXT DEFAULT 'EMERGENCY ALERT! I need immediate help at this location.',
ADD COLUMN IF NOT EXISTS test_telegram_message TEXT DEFAULT '[TEST] This is a test of your emergency Telegram alert system. No action needed.';