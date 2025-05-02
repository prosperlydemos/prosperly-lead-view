
import React from 'react';
import LeadCard from './LeadCard';
import { Lead, User, LeadStatus } from '../types';
import AddLeadButton from './AddLeadButton';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import UserManagement from './UserManagement';

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string) => void;
  onEditLead: (leadId: string) => void;
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  selectedStatus: LeadStatus | 'All';
  onStatusChange: (status: LeadStatus | 'All') => void;
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
}

const LeadList: React.FC<LeadListProps> = ({ 
  leads, 
  selectedLeadId, 
  onLeadSelect, 
  onEditLead, 
  onAddLead,
  users,
  currentUser,
  onAddUser,
  selectedStatus,
  onStatusChange,
  selectedUserId,
  onUserChange
}) => {
  // Filter leads based on selected status and user
  const filteredLeads = leads.filter(lead => {
    // Filter by status
    const statusMatch = selectedStatus === 'All' || lead.status === selectedStatus;
    
    // Filter by user (if not admin, only show owned leads)
    let userMatch = true;
    if (!currentUser.isAdmin) {
      userMatch = lead.ownerId === currentUser.id;
    } else if (selectedUserId !== 'all') {
      userMatch = lead.ownerId === selectedUserId;
    }
    
    return statusMatch && userMatch;
  });

  return (
    <div className="overflow-y-auto pr-2 h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Leads ({filteredLeads.length})</h2>
        <AddLeadButton onAddLead={onAddLead} users={users} currentUser={currentUser} />
      </div>
      
      {currentUser.isAdmin && (
        <UserManagement 
          users={users} 
          onAddUser={onAddUser} 
          currentUser={currentUser}
        />
      )}
      
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <LeadStatusFilter 
          selectedStatus={selectedStatus} 
          onStatusChange={onStatusChange} 
        />
        
        {currentUser.isAdmin && (
          <UserFilter 
            users={users} 
            selectedUserId={selectedUserId} 
            onUserChange={onUserChange}
            currentUser={currentUser}
          />
        )}
      </div>
      
      {filteredLeads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          isSelected={selectedLeadId === lead.id}
          onClick={() => onLeadSelect(lead.id)}
          onEdit={() => onEditLead(lead.id)}
          users={users}
        />
      ))}
      
      {filteredLeads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No leads match your current filters
        </div>
      )}
    </div>
  );
};

export default LeadList;
