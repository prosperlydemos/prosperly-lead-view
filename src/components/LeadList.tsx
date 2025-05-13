
import React, { useCallback, useRef, useEffect, useState } from 'react';
import LeadCard from './LeadCard';
import LeadStatusFilter from './LeadStatusFilter';
import UserFilter from './UserFilter';
import DateRangeFilter, { DateFilterOption, DateFieldOption } from './DateRangeFilter';
import { Lead, Profile } from '@/types/supabase';
import { LeadStatus } from '@/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { subDays } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface LeadListProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onLeadSelect: (leadId: string, e?: React.MouseEvent) => void;
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
  // Add search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Add ref for the selected lead card
  const selectedLeadRef = useRef<HTMLButtonElement>(null);
  
  // Add effect to handle scrolling when selectedLeadId changes
  useEffect(() => {
    if (selectedLeadId && selectedLeadRef.current) {
      // Add a small delay to ensure the DOM has updated
      setTimeout(() => {
        selectedLeadRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [selectedLeadId]);
  
  // Filter leads by status, user, date range, and search query
  const filteredLeads = leads.filter(lead => {
    const statusMatch = selectedStatus === 'All' || lead.status === selectedStatus;
    const userMatch = selectedUserId === 'all' || lead.owner_id === selectedUserId;
    
    // Search filter (case insensitive)
    const searchMatch = !searchQuery || 
      (lead.contact_name && lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // No date filtering if 'all' is selected
    if (selectedDateFilter === 'all') {
      return statusMatch && userMatch && searchMatch;
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
      return statusMatch && userMatch && searchMatch && 
        date.getFullYear() === currentYear && 
        date.getMonth() === currentMonth;
    } 
    else if (selectedDateFilter === 'last-60-days') {
      const sixtyDaysAgo = subDays(now, 60);
      return statusMatch && userMatch && searchMatch && date >= sixtyDaysAgo;
    }
    else if (selectedDateFilter === 'this-year') {
      return statusMatch && userMatch && searchMatch && date.getFullYear() === currentYear;
    }
    
    return statusMatch && userMatch && searchMatch;
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
        
        <div className="flex flex-wrap gap-4 items-center">
          <LeadStatusFilter
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
          />
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <UserFilter
              selectedUserId={selectedUserId}
              onUserChange={onUserChange}
              onUsersLoaded={onUsersLoaded}
            />
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
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
                onClick={(e) => {
                  console.log("Lead selected in LeadList:", lead.id);
                  onLeadSelect(lead.id, e);
                }}
                onEdit={() => onEditLead(lead.id)}
                ref={lead.id === selectedLeadId ? selectedLeadRef : undefined}
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
