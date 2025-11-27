-- Add persistent fields for SOS behavior
ALTER TABLE public.sos_settings
  ADD COLUMN IF NOT EXISTS shake_count integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS cooldown_period integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false;