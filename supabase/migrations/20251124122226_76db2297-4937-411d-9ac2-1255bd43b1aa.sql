-- Create storage bucket for emergency photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('emergency-photos', 'emergency-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view emergency photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload emergency photos" ON storage.objects;

-- Allow anyone to view emergency photos (critical for emergency contacts)
CREATE POLICY "Anyone can view emergency photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'emergency-photos');

-- Allow authenticated users to upload their own emergency photos
CREATE POLICY "Users can upload emergency photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'emergency-photos' AND auth.uid()::text = (storage.foldername(name))[1]);