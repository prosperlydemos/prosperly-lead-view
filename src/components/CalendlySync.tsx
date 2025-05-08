
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Define a type for the app_settings table
interface AppSetting {
  key: string;
  value: string;
}

const CalendlySync: React.FC = () => {
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fetch last sync time on component mount
  useEffect(() => {
    getLastSyncTime();
  }, []);
  
  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      console.error('Error formatting date', e);
      return dateStr;
    }
  };
  
  // Get the last sync time from the database
  const getLastSyncTime = async () => {
    try {
      // First check if the table exists
      const { data: tableExists, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: 'app_settings' });
        
      if (tableError || !tableExists) {
        console.log('app_settings table may not exist yet');
        return;
      }
      
      // Get the last sync time if the table exists
      const { data, error } = await supabase
        .from<AppSetting>('app_settings')
        .select('value')
        .eq('key', 'calendly_last_sync')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching last sync time:', error);
        return;
      }
      
      setLastSyncTime(data?.value || null);
    } catch (err) {
      console.error('Error in getLastSyncTime:', err);
    }
  };
  
  // Trigger a manual sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Get the current session using the correct method
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch('https://mfnaopgzaeewhvhhvxbd.supabase.co/functions/v1/calendly-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Calendly Sync Complete',
          description: `Created ${result.newLeads?.length || 0} new leads.`,
        });
        getLastSyncTime(); // Refresh the last sync time
      } else {
        throw new Error(result.message || 'Sync failed with unknown error');
      }
    } catch (error: any) {
      console.error('Error during manual sync:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'There was a problem syncing with Calendly.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Last sync: {formatDate(lastSyncTime)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-1"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Sync Calendly</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default CalendlySync;
