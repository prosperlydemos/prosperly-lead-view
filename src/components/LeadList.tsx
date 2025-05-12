import React, { useCallback } from 'react';
import LeadCard from './LeadCard';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import DateRangeFilter, { DateFilterOption, DateFieldOption } from './DateRangeFilter';
import { Lead, Profile } from '@/types/supabase';
import { LeadStatus } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { subDays } from 'date-fns';

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
  selectedDateFilter: DateFilterOption;
  onDateFilterChange: (filter: DateFilterOption) => void;
  selectedDateField: DateFieldOption;
  onDateFieldChange: (field: DateFieldOption) => void;
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
  onUsersLoaded,
  selectedDateFilter,
  onDateFilterChange,
  selectedDateField,
  onDateFieldChange
}) => {
  // Filter leads by status, user, and date range
  const filteredLeads = leads.filter(lead => {
    const statusMatch = selectedStatus === 'All' || lead.status === selectedStatus;
    const userMatch = selectedUserId === 'all' || lead.owner_id === selectedUserId;
    
    // No date filtering if 'all' is selected
    if (selectedDateFilter === 'all') {
      return statusMatch && userMatch;
    }
    
    // Get the appropriate date field based on user selection
    const dateField = selectedDateField === 'demo_date' ? lead.demo_date : lead.signup_date;
    
    // If there's no date in the selected field, don't include in filtered results
    if (!dateField) return false;
    
    const date = new Date(dateField);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Apply date filters
    if (selectedDateFilter === 'this-month') {
      return statusMatch && userMatch && 
        date.getFullYear() === currentYear && 
        date.getMonth() === currentMonth;
    } 
    else if (selectedDateFilter === 'last-60-days') {
      const sixtyDaysAgo = subDays(now, 60);
      return statusMatch && userMatch && date >= sixtyDaysAgo;
    }
    else if (selectedDateFilter === 'this-year') {
      return statusMatch && userMatch && date.getFullYear() === currentYear;
    }
    
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

  // Create a memoized click handler generator for lead selection
  const getLeadClickHandler = useCallback((leadId: string) => {
    return () => {
      console.log("Lead selected in LeadList:", leadId);
      onLeadSelect(leadId);
    };
  }, [onLeadSelect]);

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-semibold">Leads</h2>
      </div>

      <div className="space-y-4 mb-4 sticky top-0 bg-background z-10 pb-4">
        <DateRangeFilter
          selectedDateFilter={selectedDateFilter}
          onDateFilterChange={onDateFilterChange}
          selectedDateField={selectedDateField}
          onDateFieldChange={onDateFieldChange}
        />
        
        <div className="flex flex-wrap gap-4">
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
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-2">
          {sortedLeads.length > 0 ? (
            sortedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={lead.id === selectedLeadId}
                onClick={getLeadClickHandler(lead.id)}
                onEdit={() => onEditLead(lead.id)}
              />
            ))
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              No leads match your filters
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LeadList;
