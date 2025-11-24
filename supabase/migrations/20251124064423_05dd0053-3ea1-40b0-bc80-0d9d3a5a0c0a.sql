-- Add voice_password column to sos_settings table
ALTER TABLE public.sos_settings 
ADD COLUMN voice_password text;