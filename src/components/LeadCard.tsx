
import React, { useEffect, useState, useCallback, forwardRef } from 'react';
import { Lead, Profile } from '../types/supabase';
import { Copy, UserRound } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onEdit: () => void;
}

const LeadCard = forwardRef<HTMLButtonElement, LeadCardProps>(({ 
  lead, 
  isSelected, 
  onClick, 
  onEdit 
}, ref) => {
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

  // Get status-specific className
  const getStatusClassName = () => {
    switch (lead.status) {
      case 'Demo Scheduled':
        return 'lead-status-demo-scheduled';
      case 'Warm Lead':
        return 'lead-status-warm';
      case 'Hot Lead':
        return 'lead-status-hot';
      case 'Closed':
        return 'lead-status-closed';
      case 'Lost':
        return 'lead-status-lost';
      case 'Demo No Show':
        return 'lead-status-demo-no-show';
      default:
        return '';
    }
  };

  const ownerName = owner ? owner.name : 'Unassigned';

  const copyEmail = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.email) {
      navigator.clipboard.writeText(lead.email);
      toast({
        title: "Email copied",
        description: `${lead.email} copied to clipboard`,
      });
    }
  }, [lead.email]);

  return (
    <button 
      ref={ref}
      type="button"
      className={`w-full text-left rounded-lg border p-2 mb-2 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
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
                  type="button"
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
        
        {/* Second line: Demo date and Follow-up date or Signup date */}
        <div className="text-xs flex justify-between">
          <span>
            <span className="text-muted-foreground">Demo:</span> {formatDateForDisplay(lead.demo_date)}
          </span>
          <span>
            {lead.signup_date ? (
              <>
                <span className="text-muted-foreground">Signup Date:</span> {formatDateForDisplay(lead.signup_date)}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Next Follow-up:</span> <span className="font-bold">{formatDateForDisplay(lead.next_follow_up)}</span>
              </>
            )}
          </span>
        </div>
        
        {/* Third line: Setup Fee and MRR */}
        <div className="text-xs flex justify-between">
          <span>
            <span className="text-muted-foreground">Setup Fee:</span> ${lead.setup_fee || 0}
          </span>
          <span>
            <span className="text-muted-foreground">MRR:</span> ${lead.mrr || 0}
          </span>
        </div>
      </div>
    </button>
  );
});

LeadCard.displayName = 'LeadCard';

export default LeadCard;
