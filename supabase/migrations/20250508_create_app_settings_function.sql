
-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create app_settings table if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'app_settings'
  ) THEN
    CREATE TABLE public.app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    -- Set RLS for the app_settings table
    ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
    
    -- Create policy that allows only admins to modify app settings
    CREATE POLICY "Allow admins to manage app settings" 
      ON public.app_settings 
      USING (
        (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
      );
    
    -- Create policy that allows authenticated users to view app settings
    CREATE POLICY "Allow authenticated users to view app settings" 
      ON public.app_settings 
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
