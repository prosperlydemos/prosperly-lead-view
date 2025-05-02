
import React from 'react';
import { Lead } from '../types';
import { format } from 'date-fns';
import { Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, isSelected, onClick, onEdit }) => {
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

  // Stop propagation to prevent triggering card click when clicking edit button
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div 
      className={`rounded-lg border p-3 mb-2 cursor-pointer transition-all ${getStatusClassName()} ${isSelected ? 'ring-2 ring-primary' : ''}`}
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
              <span className="text-muted-foreground">Source:</span> {lead.leadSource}
            </div>
            <div>
              <span className="text-muted-foreground">Setup:</span> ${lead.setupFee}
            </div>
            <div>
              <span className="text-muted-foreground">MRR:</span> ${lead.mrr}
            </div>
            <div>
              <Button variant="ghost" size="sm" className="h-6 p-0" onClick={handleEditClick}>
                <Edit size={14} className="mr-1" />
                <span className="text-xs">Edit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
