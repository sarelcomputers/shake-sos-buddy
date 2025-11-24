-- Add consent tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_date timestamp with time zone;