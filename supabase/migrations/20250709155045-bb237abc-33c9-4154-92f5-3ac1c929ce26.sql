
-- Add kickoff_completed field to leads table
ALTER TABLE public.leads 
ADD COLUMN kickoff_completed BOOLEAN NOT NULL DEFAULT false;

-- Add an index for better performance when querying closed leads without kickoff
CREATE INDEX idx_leads_closed_no_kickoff 
ON public.leads (status, kickoff_completed) 
WHERE status = 'Closed' AND kickoff_completed = false;
