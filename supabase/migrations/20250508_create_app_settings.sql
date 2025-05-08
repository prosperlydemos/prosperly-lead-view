
-- Create settings table to track sync times
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings" 
  ON public.app_settings
  FOR SELECT 
  TO authenticated
  USING (true);

-- Only allow authenticated admin users to modify settings
CREATE POLICY "Allow authenticated admin users to modify settings" 
  ON public.app_settings
  FOR ALL 
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
