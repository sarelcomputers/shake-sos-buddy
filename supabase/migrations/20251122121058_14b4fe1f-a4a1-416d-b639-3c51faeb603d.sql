-- Add DELETE policy for sos_settings table
CREATE POLICY "Users can delete own settings"
ON public.sos_settings
FOR DELETE
USING (auth.uid() = user_id);