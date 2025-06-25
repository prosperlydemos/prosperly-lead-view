
-- Add demo_booked_date column to track when demos were booked
ALTER TABLE public.leads 
ADD COLUMN demo_booked_date timestamp with time zone;

-- Update existing leads that have demo dates to set demo_booked_date to created_at
-- This assumes demos were booked when the lead was created (best approximation for existing data)
UPDATE public.leads 
SET demo_booked_date = created_at 
WHERE demo_date IS NOT NULL AND demo_booked_date IS NULL;
