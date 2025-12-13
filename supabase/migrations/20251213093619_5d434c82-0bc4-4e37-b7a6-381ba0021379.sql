-- Add whatsapp_trigger_enabled column to sos_settings
ALTER TABLE public.sos_settings 
ADD COLUMN IF NOT EXISTS whatsapp_trigger_enabled boolean DEFAULT false;

-- Add whatsapp_message column if not exists
ALTER TABLE public.sos_settings 
ADD COLUMN IF NOT EXISTS whatsapp_message text DEFAULT 'EMERGENCY! I need help at this location:';