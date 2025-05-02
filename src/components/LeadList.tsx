
import React from 'react';
import LeadCard from './LeadCard';
import { Lead } from '../types';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string) => void;
}

const LeadList: React.FC<LeadListProps> = ({ leads, selectedLeadId, onLeadSelect }) => {
  return (
    <div className="overflow-y-auto pr-2 h-[calc(100vh-100px)]">
      <h2 className="text-xl font-bold mb-4">Leads ({leads.length})</h2>
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          isSelected={selectedLeadId === lead.id}
          onClick={() => onLeadSelect(lead.id)}
        />
      ))}
    </div>
  );
};

export default LeadList;
