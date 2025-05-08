
import React from 'react';
import LeadCard from './LeadCard';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import { Lead, Profile } from '@/types/supabase';
import { LeadStatus } from '@/types';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string) => void;
  onEditLead: (leadId: string) => void;
  onAddLead: () => void;
  selectedStatus: LeadStatus | 'All';
  onStatusChange: (status: LeadStatus | 'All') => void;
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
  onUsersLoaded?: (users: Profile[]) => void;
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
  
  // Sort leads by demo date (oldest first)
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    // If no demo date, put at the end
    if (!a.demo_date) return 1;
    if (!b.demo_date) return -1;
    
    // Sort by demo date (oldest first)
    return new Date(a.demo_date).getTime() - new Date(b.demo_date).getTime();
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
          onUsersLoaded={onUsersLoaded}
        />
      </div>

      <div className="space-y-2">
        {sortedLeads.length > 0 ? (
          sortedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={lead.id === selectedLeadId}
              onClick={() => onLeadSelect(lead.id)}
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
