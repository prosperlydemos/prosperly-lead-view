
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CalendlySync = () => {
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Check local storage for auto-sync preference on component mount
  useEffect(() => {
    const savedAutoSync = localStorage.getItem('calendly-auto-sync');
    if (savedAutoSync === 'true') {
      setAutoSync(true);
    }
    
    const lastSync = localStorage.getItem('calendly-last-sync');
    if (lastSync) {
      setLastSyncTime(lastSync);
    }
  }, []);
  
  // Setup interval for auto-sync (every 4 hours)
  useEffect(() => {
    let interval: number | undefined;
    
    if (autoSync) {
      // Store preference in local storage
      localStorage.setItem('calendly-auto-sync', 'true');
      
      // Initial sync when turned on
      handleSync();
      
      // Set up interval (4 hours = 4 * 60 * 60 * 1000 ms)
      interval = window.setInterval(() => {
        handleSync();
      }, 4 * 60 * 60 * 1000);
    } else {
      localStorage.setItem('calendly-auto-sync', 'false');
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoSync]);
  
  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    
    try {
      // Call our edge function
      const { data, error } = await supabase.functions.invoke('calendly-webhook', {
        method: 'GET',
        body: { action: 'sync' }
      });
      
      if (error) {
        console.error("Error syncing Calendly:", error);
        toast({
          title: "Sync Failed",
          description: `Failed to sync with Calendly: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Calendly sync result:", data);
        
        // Update last sync time
        const now = new Date().toISOString();
        localStorage.setItem('calendly-last-sync', now);
        setLastSyncTime(now);
        
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${data.processed?.length || 0} leads from Calendly`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Exception syncing Calendly:", error);
      toast({
        title: "Sync Failed",
        description: `An unexpected error occurred: ${error}`,
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  // Format time nicely
  const formatLastSync = () => {
    if (!lastSyncTime) return "Never";
    
    try {
      const date = new Date(lastSyncTime);
      return new Intl.DateTimeFormat('en-US', { 
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      return "Unknown";
    }
  };
  
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Calendly Integration</h3>
            <p className="text-sm text-gray-500">Sync your Calendly appointments as leads</p>
          </div>
          
          <div className="flex items-center gap-2">
            {!isMobile && lastSyncTime && (
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="mr-1 h-3 w-3" /> Last sync: {formatLastSync()}
              </span>
            )}
            
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="min-w-[120px]"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isMobile && lastSyncTime && (
          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="mr-1 h-3 w-3" /> Last sync: {formatLastSync()}
          </div>
        )}
        
        <div className="flex items-center space-x-2 mt-1">
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
          <label 
            htmlFor="auto-sync"
            className="text-sm cursor-pointer"
          >
            Auto-sync every 4 hours
          </label>
        </div>
        
        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="webhook-setup">
            <AccordionTrigger className="text-sm">
              Set up automatic webhook integration
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <p>To set up automatic lead creation when appointments are scheduled:</p>
                
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to your <a 
                    href="https://calendly.com/app/webhook_subscriptions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    Calendly Webhook Settings
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a></li>
                  <li>Click "Create Webhook"</li>
                  <li>Enter this URL: <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">https://mfnaopgzaeewhvhhvxbd.supabase.co/functions/v1/calendly-webhook</code></li>
                  <li>Select the "invitee.created" event</li>
                  <li>Save the webhook</li>
                </ol>
                
                <p className="text-xs text-gray-500 mt-2">Once set up, new leads will be created automatically when appointments are scheduled in Calendly.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default CalendlySync;
