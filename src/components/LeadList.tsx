
import React from 'react';
import LeadCard from './LeadCard';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import { Lead, Profile } from '@/types/supabase';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string) => void;
  onEditLead: (leadId: string) => void;
  onAddLead: () => void;
  selectedStatus: string | 'All';
  onStatusChange: (status: string | 'All') => void;
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
  onUsersLoaded?: (users: Profile[]) => void; // New prop
}

const LeadList: React.FC<LeadListProps> = ({
  leads,
  selectedLeadId,
  onLeadSelect,
  onEditLead,
  onAddLead,
  selectedStatus,
  onStatusChange,
  selectedUserId,
  onUserChange,
  onUsersLoaded
}) => {
  // Filter leads by status and user
  const filteredLeads = leads.filter(lead => {
    const statusMatch = selectedStatus === 'All' || lead.status === selectedStatus;
    const userMatch = selectedUserId === 'all' || lead.owner_id === selectedUserId;
    return statusMatch && userMatch;
  });

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-semibold">Leads</h2>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <LeadStatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={onStatusChange}
        />
        <UserFilter
          selectedUserId={selectedUserId}
          onUserChange={onUserChange}
          onUsersLoaded={onUsersLoaded} // Pass the callback here
        />
      </div>

      <div className="space-y-2">
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={lead.id === selectedLeadId}
              onSelect={() => onLeadSelect(lead.id)}
              onEdit={() => onEditLead(lead.id)}
            />
          ))
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
            No leads match your filters
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadList;
