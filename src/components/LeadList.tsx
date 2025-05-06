
import React, { useState } from 'react';
import LeadCard from './LeadCard';
import { Lead } from '../types/supabase';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
  onUserChange
}) => {
  const { profile: currentUser } = useAuth();

  // Filter leads based on selected status and user
  const filteredLeads = leads.filter(lead => {
    // Filter by status
    const statusMatch = selectedStatus === 'All' || lead.status === selectedStatus;
    
    // Filter by user (if not admin, only show owned leads)
    let userMatch = true;
    if (currentUser && !currentUser.is_admin) {
      userMatch = lead.owner_id === currentUser.id;
    } else if (selectedUserId !== 'all') {
      userMatch = lead.owner_id === selectedUserId;
    }
    
    return statusMatch && userMatch;
  });

  return (
    <div className="overflow-y-auto pr-2 h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Leads ({filteredLeads.length})</h2>
        <Button onClick={onAddLead}>
          <PlusCircle size={16} className="mr-1" />
          Add Lead
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <LeadStatusFilter 
          selectedStatus={selectedStatus} 
          onStatusChange={onStatusChange} 
        />
        
        {currentUser?.is_admin && (
          <UserFilter 
            selectedUserId={selectedUserId} 
            onUserChange={onUserChange}
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
