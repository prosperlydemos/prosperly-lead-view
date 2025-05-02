
import React from 'react';
import { Lead } from '../types';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, onClick }) => {
  // Helper function to format date strings for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
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

  return (
    <div 
      className={`rounded-lg border p-2 mb-2 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-base">{lead.contactName}</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              {lead.status}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {lead.email}
          </div>
          
          <div className="font-medium text-sm mb-1">
            {lead.businessName}
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span className="text-muted-foreground">Demo:</span> {formatDate(lead.demoDate)}
            </div>
            <div>
              <span className="text-muted-foreground">Signup:</span> {formatDate(lead.signupDate)}
            </div>
            <div>
              <span className="text-muted-foreground">Setup:</span> ${lead.setupFee}
            </div>
            <div>
              <span className="text-muted-foreground">MRR:</span> ${lead.mrr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
