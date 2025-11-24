-- Create storage bucket for SOS recordings (audio and photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sos-recordings', 'sos-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for SOS recordings bucket
CREATE POLICY "Users can upload own SOS recordings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sos-recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own SOS recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sos-recordings'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can view all SOS recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sos-recordings'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view SOS recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'sos-recordings');
