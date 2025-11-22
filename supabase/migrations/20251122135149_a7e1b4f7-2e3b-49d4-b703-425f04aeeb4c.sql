-- Create personal_info table for emergency contact details
CREATE TABLE IF NOT EXISTS public.personal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  surname TEXT,
  blood_type TEXT,
  medical_aid_name TEXT,
  medical_aid_number TEXT,
  spouse_name TEXT,
  spouse_contact TEXT,
  friend_name TEXT,
  friend_surname TEXT,
  friend_contact TEXT,
  gender TEXT,
  age INTEGER,
  vehicle_brand TEXT,
  vehicle_color TEXT,
  vehicle_registration TEXT,
  home_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.personal_info ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal info
CREATE POLICY "Users can view own personal info"
ON public.personal_info
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own personal info
CREATE POLICY "Users can insert own personal info"
ON public.personal_info
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own personal info
CREATE POLICY "Users can update own personal info"
ON public.personal_info
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own personal info
CREATE POLICY "Users can delete own personal info"
ON public.personal_info
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all personal info
CREATE POLICY "Admins can view all personal info"
ON public.personal_info
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_personal_info_updated_at
BEFORE UPDATE ON public.personal_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();