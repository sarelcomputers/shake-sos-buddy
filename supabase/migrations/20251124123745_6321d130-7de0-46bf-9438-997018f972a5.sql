-- Update default trial period to 14 days
ALTER TABLE public.subscriptions 
ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '14 days');