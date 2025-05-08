
-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up a cron job to run every 4 hours
SELECT cron.schedule(
  'calendly-sync-every-4-hours',
  '0 */4 * * *', -- Run at minute 0 of every 4th hour
  $$
  SELECT
    net.http_post(
      url:='https://mfnaopgzaeewhvhhvxbd.supabase.co/functions/v1/calendly-sync',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmFvcGd6YWVld2h2aGh2eGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTI5NTksImV4cCI6MjA2MjEyODk1OX0.iDMZvfccrvO_wbtgPPf_RjVlyKV401kM8cNppNBoG14"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
