-- Add test_message column to sos_settings table
ALTER TABLE public.sos_settings 
ADD COLUMN test_message TEXT NOT NULL DEFAULT '[TEST] This is a test of your emergency alert system. No action needed.';