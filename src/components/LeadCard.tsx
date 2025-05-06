
import React, { useEffect, useState } from 'react';
import { Lead, Profile } from '../types/supabase';
import { format } from 'date-fns';
import { Copy, UserRound } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
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
        return 'bg-purple-50';
      case 'Warm':
        return 'bg-blue-50';
      case 'Hot':
        return 'bg-red-50';
      case 'Closed':
        return 'bg-green-50';
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
      className={`rounded-lg border p-4 mb-2 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''} relative`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2">
        {/* Lead name and company */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-md">{lead.contact_name}</h3>
            {lead.business_name && (
              <p className="text-sm text-muted-foreground">{lead.business_name}</p>
            )}
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
            {lead.status}
          </span>
        </div>
        
        {/* Email with copy button */}
        {lead.email && (
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span>{lead.email}</span>
            <button 
              onClick={copyEmail}
              className="ml-1 hover:text-primary"
              aria-label="Copy email"
            >
              <Copy size={14} />
            </button>
          </div>
        )}
        
        {/* Value */}
        <div className="text-sm">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-semibold"> ${lead.value}</span>
        </div>
        
        {/* Next follow-up */}
        <div className="text-sm">
          <span className="text-muted-foreground">Next Follow-up:</span>
          <span> {formatDate(lead.next_follow_up)}</span>
        </div>
        
        {/* Owner */}
        <div className="text-sm flex items-center gap-1 mt-1">
          <UserRound size={14} className="text-muted-foreground" />
          <span>{ownerName}</span>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
