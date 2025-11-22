-- Add audio_transcript column to sos_history table
ALTER TABLE public.sos_history
ADD COLUMN audio_transcript text,
ADD COLUMN audio_duration_seconds integer;