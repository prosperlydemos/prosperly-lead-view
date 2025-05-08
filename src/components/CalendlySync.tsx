
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CalendlySync = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  
  const handleSync = async () => {
    setSyncing(true);
    
    try {
      // Call our edge function
      const { data, error } = await supabase.functions.invoke('calendly-webhook', {
        method: 'GET',
        query: { action: 'sync' }
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
  
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Calendly Integration</h3>
          <p className="text-sm text-gray-500">Sync your Calendly appointments as leads</p>
        </div>
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
            <>Sync Now</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CalendlySync;
