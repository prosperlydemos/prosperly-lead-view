
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from '../types/supabase';
import { format } from 'date-fns';
import { Check, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KickoffListProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  onMarkComplete: (leadId: string) => void;
  onViewLead: (leadId: string) => void;
}

const KickoffList: React.FC<KickoffListProps> = ({ 
  isOpen, 
  onClose, 
  leads,
  onMarkComplete,
  onViewLead
}) => {
  // Filter leads to show only closed leads without completed kickoff
  // This ensures that once kickoff_completed is true, they won't appear
  const kickoffPendingLeads = leads.filter(
    lead => lead.status === 'Closed' && lead.kickoff_completed === false
  );

  console.log('KickoffList - All leads:', leads.length);
  console.log('KickoffList - Closed leads:', leads.filter(l => l.status === 'Closed').length);
  console.log('KickoffList - Pending kickoff leads:', kickoffPendingLeads.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kickoff Calls Pending ({kickoffPendingLeads.length})</DialogTitle>
        </DialogHeader>

        {kickoffPendingLeads.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No pending kickoff calls
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {kickoffPendingLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{lead.contact_name}</div>
                    <div className="text-sm text-muted-foreground">{lead.business_name}</div>
                    <div className="text-xs flex items-center">
                      <UserCheck className="mr-1" size={14} />
                      Closed: {lead.closing_date ? format(new Date(lead.closing_date), 'PPP') : 'Recently'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewLead(lead.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkComplete(lead.id)}
                      className="flex items-center"
                    >
                      <Check className="mr-1" size={16} />
                      Completed
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KickoffList;
