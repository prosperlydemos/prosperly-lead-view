
import React from 'react';
import { Lead } from '../types';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, onClick }) => {
  // Helper function to format date strings for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Get status-specific className
  const getStatusClassName = () => {
    switch (lead.status) {
      case 'Demo Scheduled':
        return 'lead-status-demo-scheduled';
      case 'Warm':
        return 'lead-status-warm';
      case 'Hot':
        return 'lead-status-hot';
      case 'Closed':
        return 'lead-status-closed';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`rounded-lg border p-4 mb-3 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{lead.contactName}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
          {lead.status}
        </span>
      </div>
      
      <div className="text-sm text-muted-foreground mb-1">
        {lead.email}
      </div>
      
      <div className="font-medium mb-3">
        {lead.businessName}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Source:</span> {lead.leadSource}
        </div>
        <div>
          <span className="text-muted-foreground">Setup:</span> ${lead.setupFee}
        </div>
        <div>
          <span className="text-muted-foreground">MRR:</span> ${lead.mrr}
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t text-sm">
        <div className="flex items-center gap-1 mb-1">
          <Calendar size={14} />
          <span className="text-muted-foreground mr-1">Demo:</span>
          {formatDate(lead.demoDate)}
        </div>
        {lead.signupDate && (
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span className="text-muted-foreground mr-1">Signed:</span>
            {formatDate(lead.signupDate)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCard;
