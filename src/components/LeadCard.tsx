
import React from 'react';
import { Lead, User } from '../types';
import { format } from 'date-fns';
import { Copy, UserRound } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  users: User[];
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, onClick, users }) => {
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

  // Find owner name
  const owner = users.find(user => user.id === lead.ownerId);
  const ownerName = owner ? owner.name : 'Unassigned';

  const copyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lead.email);
    toast({
      title: "Email copied",
      description: `${lead.email} copied to clipboard`,
    });
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
            <h3 className="font-semibold text-sm">{lead.contactName}</h3>
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
          </div>
          <span className="text-xs flex items-center gap-1">
            <UserRound size={12} />
            {ownerName}
          </span>
        </div>
        
        {/* Second line: Demo date and Next Follow-up date */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>
            <span className="text-muted-foreground">Demo Date:</span> {formatDate(lead.demoDate)}
          </div>
          <div>
            <span className="text-muted-foreground">Next Follow-up:</span> {formatDate(lead.nextFollowUp)}
          </div>
        </div>
        
        {/* Third line: Setup Fee and MRR */}
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>
            <span className="text-muted-foreground">Setup:</span> ${lead.setupFee}
          </div>
          <div>
            <span className="text-muted-foreground">MRR:</span> ${lead.mrr}
          </div>
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
