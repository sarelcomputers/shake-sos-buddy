-- Add device and network information columns to sos_history table
ALTER TABLE public.sos_history
ADD COLUMN device_model text,
ADD COLUMN device_serial text,
ADD COLUMN network_isp text,
ADD COLUMN ip_address text,
ADD COLUMN wifi_info jsonb;