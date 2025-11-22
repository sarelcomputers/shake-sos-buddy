-- Add personal_info column to sos_history table to store a snapshot of user's personal information at the time of the alert
ALTER TABLE public.sos_history 
ADD COLUMN personal_info jsonb DEFAULT '{}'::jsonb;