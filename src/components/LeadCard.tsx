
import React, { useEffect, useState } from 'react';
import { Lead, Profile } from '../types/supabase';
import { format } from 'date-fns';
import { Copy, UserRound } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;  // Changed from onSelect to onClick
  onEdit: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, onClick, onEdit }) => {
  const [owner, setOwner] = useState<Profile | null>(null);
  
  useEffect(() => {
    const fetchOwner = async () => {
      if (lead.owner_id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', lead.owner_id)
          .single();
          
        if (!error && data) {
          setOwner(data);
        }
      }
    };
    
    fetchOwner();
  }, [lead.owner_id]);

  // Helper function to format date strings for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status-specific className
  const getStatusClassName = () => {
    switch (lead.status) {
      case 'Demo Scheduled':
        return 'lead-status-demo-scheduled';
      case 'Warm':
        return 'lead-status-warm bg-blue-50';
      case 'Hot':
        return 'lead-status-hot bg-red-50';
      case 'Closed':
        return 'lead-status-closed bg-green-50';
      default:
        return '';
    }
  };

  const ownerName = owner ? owner.name : 'Unassigned';

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      toast({
        title: "Email copied",
        description: `${lead.email} copied to clipboard`,
      });
    }
  };

  return (
    <div 
      className={`rounded-lg border p-2 mb-2 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        {/* First line: Lead name, email with copy icon, sales rep name (right-aligned) */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-sm">{lead.contact_name}</h3>
            {lead.email && (
              <span className="text-xs text-muted-foreground">
                ({lead.email}) 
                <button 
                  onClick={copyEmail} 
                  className="ml-1 inline-flex hover:text-primary"
                  aria-label="Copy email"
                >
                  <Copy size={12} />
                </button>
              </span>
            )}
          </div>
          <span className="text-xs flex items-center gap-1">
            <UserRound size={12} />
            {ownerName}
          </span>
        </div>
        
        {/* Second line: Follow-up date */}
        <div className="text-xs">
          <span className="text-muted-foreground">Next Follow-up:</span> {formatDate(lead.next_follow_up)}
        </div>
        
        {/* Third line: Value */}
        <div className="text-xs">
          <span className="text-muted-foreground">Value:</span> ${lead.value}
        </div>
        
        {/* Status tag at the top right */}
        <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
          {lead.status}
        </span>
      </div>
    </div>
  );
};

export default LeadCard;
