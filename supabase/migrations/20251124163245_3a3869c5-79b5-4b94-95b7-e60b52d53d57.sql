-- Add id_number column to personal_info table
ALTER TABLE public.personal_info 
ADD COLUMN id_number TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.personal_info.id_number IS 'South African ID number (13 digits: YYMMDD SSSS C A Z)';