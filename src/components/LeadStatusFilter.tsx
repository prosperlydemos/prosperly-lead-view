
import React from 'react';
import { LeadStatus } from '../types';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface LeadStatusFilterProps {
  selectedStatus: LeadStatus | 'All';
  onStatusChange: (status: LeadStatus | 'All') => void;
}

const LeadStatusFilter: React.FC<LeadStatusFilterProps> = ({ selectedStatus, onStatusChange }) => {
  // Status options with UI colors
  const statuses: Array<{ value: LeadStatus | 'All', label: string, color?: string }> = [
    { value: 'All', label: 'All Leads' },
    { value: 'Demo Scheduled', label: 'Demo Scheduled', color: 'bg-white border' },
    { value: 'Warm Lead', label: 'Warm Lead', color: 'bg-[#FBECD9]' },
    { value: 'Hot Lead', label: 'Hot Lead', color: 'bg-[#F5D9D6]' },
    { value: 'Closed', label: 'Closed', color: 'bg-[#DBF1DE]' },
    { value: 'Lost', label: 'Lost', color: 'bg-[#F8F8F8]' },
    { value: 'Demo No Show', label: 'Demo No Show' }
  ];

  return (
    <div className="mb-4">
      <RadioGroup value={selectedStatus} onValueChange={(value) => onStatusChange(value as LeadStatus | 'All')} className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <div key={status.value} className="flex items-center space-x-2">
            <RadioGroupItem value={status.value} id={`filter-${status.value}`} />
            <Label htmlFor={`filter-${status.value}`} className="cursor-pointer">
              <Badge variant="outline" className={`${status.color || ''} whitespace-nowrap`}>
                {status.label}
              </Badge>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default LeadStatusFilter;
