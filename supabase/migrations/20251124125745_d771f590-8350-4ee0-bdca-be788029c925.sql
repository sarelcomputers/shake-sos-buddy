-- Add SMS trigger enable/disable field to sos_settings
ALTER TABLE public.sos_settings
ADD COLUMN sms_trigger_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.sos_settings.sms_trigger_enabled IS 'Enable or disable SMS emergency alerts';