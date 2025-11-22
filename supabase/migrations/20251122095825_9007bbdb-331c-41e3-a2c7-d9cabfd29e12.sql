-- Add contacted_recipients column to store who was contacted
ALTER TABLE public.sos_history 
ADD COLUMN contacted_recipients JSONB NOT NULL DEFAULT '[]'::jsonb;