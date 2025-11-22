-- Update RLS policy on sos_history to allow admin/control room access to all alerts
DROP POLICY IF EXISTS "Control room can view all alerts" ON public.sos_history;

CREATE POLICY "Control room can view all alerts"
ON public.sos_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Enable realtime for sos_history table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_history;