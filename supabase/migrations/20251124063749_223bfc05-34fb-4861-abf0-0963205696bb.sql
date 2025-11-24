-- Add voice_alert_enabled column to sos_settings table
ALTER TABLE public.sos_settings 
ADD COLUMN voice_alert_enabled boolean NOT NULL DEFAULT true;