import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import TodoList from '../components/TodoList';
import { Note, Lead, mapSupabaseLeadToAppLead, mapAppLeadToSupabaseLead, Profile } from '../types/supabase';
import { toast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo, UserCheck } from 'lucide-react';
import { isToday, parseISO, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserNavbar } from '@/components/UserNavbar';
import { Lead as AppLead, LeadStatus, User } from '../types/index';
import UserManagement from '../components/UserManagement';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import EditLeadDialog from '@/components/leads/EditLeadDialog';
import CalendlySync from '@/components/CalendlySync';
import { DateFilterOption, DateFieldOption } from '@/components/DateRangeFilter';
import KickoffList from '../components/KickoffList';

interface TodoItem {
  id: string;
  leadId: string;
  contactName: string;
  businessName: string;
  dueDate: string;
  completed: boolean;
  type: 'follow-up' | 'demo';
  time?: string; // Optional time for demo items
}

const Index: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'All'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [isKickoffListOpen, setIsKickoffListOpen] = useState(false);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterOption>('last-60-days');
  const [selectedDateField, setSelectedDateField] = useState<DateFieldOption>('demo_date');

  // Memoize the selected lead to prevent unnecessary recalculations
  const selectedLead = useMemo(() => 
    selectedLeadId ? leads.find(lead => lead.id === selectedLeadId) : null,
    [selectedLeadId, leads]
  );

  // Memoize the app selected lead
  const appSelectedLead = useMemo(() => 
    selectedLead ? mapSupabaseLeadToAppLead(selectedLead) : null,
    [selectedLead]
  );

  // Function to manually refresh leads data - simplified dependencies
  const refreshLeads = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Fetch leads based on user's role
      let query = supabase.from('leads').select('*');
      
      // If not admin, only fetch user's leads
      if (!currentUser.is_admin) {
        query = query.eq('owner_id', currentUser.id);
      }
      
      const { data: leadsData, error: leadsError } = await query;
      
      if (leadsError) {
        throw leadsError;
      }
      
      setLeads(leadsData || []);
      
      toast({
        title: "Leads refreshed",
        description: "Lead list has been updated with the latest data."
      });
    } catch (error) {
      console.error('Error refreshing leads:', error);
      toast({
        title: "Error refreshing leads",
        description: "Failed to refresh lead data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.is_admin]);

  // Modified handleLeadSelect with stable dependencies
  const handleLeadSelect = useCallback((leadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Lead selected in Index:', leadId);
    setSelectedLeadId(leadId);
  }, []);

  const handleAddNote = useCallback(async (leadId: string, content: string, followUpDate?: string | null) => {
    if (!currentUser?.id) return;
    
    try {
      const newNote = {
        lead_id: leadId,
        user_id: currentUser.id,
        content
      };
      
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();
        
      if (noteError) throw noteError;
      
      setNotes(prev => [...prev, noteData]);
      
      // If a follow-up date is provided, update the lead's next_follow_up
      if (followUpDate) {
        const { error: leadError } = await supabase
          .from('leads')
          .update({ next_follow_up: followUpDate })
          .eq('id', leadId);
          
        if (leadError) throw leadError;
        
        // Update the leads state with the new follow-up date
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? { ...lead, next_follow_up: followUpDate } : lead
        ));
      }
      
      // Mark todo item for this lead as completed when a note is added
      setTodoItems(prev => prev.map(item => 
        item.leadId === leadId ? { ...item, completed: true } : item
      ));
      
      toast({
        title: "Note added",
        description: "Your note has been saved successfully."
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error adding note",
        description: "Failed to save your note",
        variant: "destructive"
      });
    }
  }, [currentUser?.id]);

  const handleStatusChange = useCallback(async (leadId: string, status: string) => {
    try {
      // If changing to Closed status, update the closing_date
      const updates: Partial<Lead> = { status };
      
      if (status === 'Closed') {
        updates.closing_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();
        
      if (error) throw error;
      
      setLeads(prev => 
        prev.map(lead => lead.id === leadId ? data : lead)
      );
      
      toast({
        title: "Status updated",
        description: `Lead status changed to ${status}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: "Failed to update the lead status",
        variant: "destructive"
      });
    }
  }, []);

  // Modified handleEditLead with stable dependencies
  const handleEditLead = useCallback((leadId: string) => {
    console.log('Edit lead clicked:', leadId);
    setSelectedLeadId(leadId);
    setIsEditModalOpen(true);
  }, []);

  const handleSaveLead = useCallback(async (updatedLead: AppLead) => {
    console.log('=== SAVE LEAD DEBUG ===');
    console.log('1. Save initiated with lead:', updatedLead);
    try {
      const supabaseUpdatedLead = mapAppLeadToSupabaseLead(updatedLead);
      console.log('2. Mapped to Supabase format:', supabaseUpdatedLead);
      
      const { data, error } = await supabase
        .from('leads')
        .update(supabaseUpdatedLead)
        .eq('id', updatedLead.id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log('3. Supabase response:', data);
      
      // Manually update the leads array for immediate UI feedback
      setLeads(prev => {
        console.log('4. Previous leads state:', prev);
        const newLeads = prev.map(lead => {
          if (lead.id === updatedLead.id) {
            console.log('5. Updating lead in array:', lead.id);
            return data;
          }
          return lead;
        });
        console.log('6. New leads state:', newLeads);
        return newLeads;
      });
      
      setIsEditModalOpen(false);
      
      toast({
        title: "Lead updated",
        description: "Lead information has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error updating lead",
        description: "Failed to update the lead information",
        variant: "destructive"
      });
    }
  }, []);
  
  const handleDeleteLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
        
      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      // Notes will be automatically deleted due to cascade delete
      setNotes(prev => prev.filter(note => note.lead_id !== leadId));
      
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }
      
      toast({
        title: "Lead deleted",
        description: "Lead and associated notes have been deleted."
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error deleting lead",
        description: "Failed to delete the lead",
        variant: "destructive"
      });
    }
  }, [selectedLeadId]);
  
  const handleStatusFilterChange = useCallback((status: LeadStatus | 'All') => {
    setSelectedStatus(status);
  }, []);
  
  const handleUserFilterChange = useCallback((userId: string | 'all') => {
    setSelectedUserId(userId);
  }, []);

  const handleUsersLoaded = useCallback((loadedUsers: Profile[]) => {
    setUsers(loadedUsers);
  }, []);
  
  const handleMarkTodoComplete = useCallback((todoId: string) => {
    console.log('Marking todo complete:', todoId);
    
    setTodoItems(prev => {
      const updatedItems = prev.map(item => 
        item.id === todoId ? { ...item, completed: true } : item
      );
      console.log('Updated todo items after completion');
      return updatedItems;
    });
    
    toast({
      title: "Task completed",
      description: "Follow-up task marked as completed."
    });
  }, []);

  const handleAddLead = useCallback(async (newLead: Omit<AppLead, 'id'>) => {
    if (!currentUser?.id) return;
    
    try {
      // Ensure all required fields are set for Supabase schema
      const leadToInsert = {
        ...newLead as AppLead,
        id: undefined, // Let Supabase generate the ID
        contactName: newLead.contactName || 'New Contact',
        status: newLead.status || 'Demo Scheduled' as LeadStatus,
        ownerId: newLead.ownerId || currentUser.id,
        value: newLead.value || (newLead.mrr ? newLead.mrr * 12 : 0)
      };
      
      const supabaseNewLead = mapAppLeadToSupabaseLead(leadToInsert);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(supabaseNewLead)
        .select()
        .single();
        
      if (error) throw error;
      
      setLeads(prev => [...prev, data]);
      
      toast({
        title: "Lead added",
        description: "New lead has been added successfully."
      });
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error adding lead",
        description: "Failed to add new lead",
        variant: "destructive"
      });
    }
  }, [currentUser?.id]);

  // Trigger a refresh of leads - simplified dependencies
  const triggerRefresh = useCallback(() => {
    refreshLeads();
    setRefreshTrigger(prev => prev + 1);
  }, [refreshLeads]);

  // User management functions with stable dependencies
  const onAddUser = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      console.log('Adding user:', userData);
      
      // Create a new profile directly in the profiles table
      // Generate a UUID for the new user profile
      const newUserId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          name: userData.name,
          email: userData.email,
          is_admin: userData.isAdmin,
          commission_rules: userData.commissionRules as any || [{ threshold: 0, amount: 100 }]
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local users state
      setUsers(prev => [...prev, data]);
      
      toast({
        title: "User added successfully",
        description: `${userData.name} has been added to the team.`
      });
      
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error adding user",
        description: `Failed to add user: ${(error as Error).message}`,
        variant: "destructive"
      });
      throw error;
    }
  }, []);

  const onUpdateUser = useCallback(async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: updatedUser.name,
          email: updatedUser.email,
          is_admin: updatedUser.isAdmin,
          commission_rules: updatedUser.commissionRules as any
        })
        .eq('id', updatedUser.id);
        
      if (error) throw error;
      
      // Update local users state
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id 
          ? { 
              ...user, 
              name: updatedUser.name, 
              email: updatedUser.email, 
              is_admin: updatedUser.isAdmin, 
              commission_rules: updatedUser.commissionRules as any
            }
          : user
      ));
      
      toast({
        title: "User updated",
        description: `${updatedUser.name} has been updated successfully.`
      });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error updating user",
        description: `Failed to update user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  }, []);

  const onDeleteUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local users state
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User deleted",
        description: "User has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: `Failed to delete user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  }, []);

  const handleMarkKickoffComplete = useCallback(async (leadId: string) => {
    try {
      console.log('Marking kickoff complete for lead:', leadId);
      
      const { error } = await supabase
        .from('leads')
        .update({ kickoff_completed: true })
        .eq('id', leadId);
        
      if (error) throw error;
      
      // Update the leads state immediately for UI responsiveness
      setLeads(prev => {
        const updatedLeads = prev.map(lead => 
          lead.id === leadId ? { ...lead, kickoff_completed: true } : lead
        );
        console.log('Updated leads state after kickoff completion');
        return updatedLeads;
      });
      
      toast({
        title: "Kickoff completed",
        description: "Kickoff call marked as completed."
      });
    } catch (error) {
      console.error('Error marking kickoff complete:', error);
      toast({
        title: "Error updating kickoff status",
        description: "Failed to mark kickoff as completed",
        variant: "destructive"
      });
    }
  }, []);

  // Fetch leads with real-time subscription - fixed dependencies
  useEffect(() => {
    if (!currentUser?.id) return;

    // Set up real-time subscription with better filtering
    const subscription = supabase
      .channel('leads_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          // Skip updates during modal editing to prevent form resets
          if (isEditModalOpen) {
            console.log('Skipping real-time update during edit modal');
            return;
          }

          // Only update if the change affects the current user's leads
          const updatedLead = payload.new as Lead;
          if (updatedLead && !currentUser.is_admin && updatedLead.owner_id !== currentUser.id) {
            return;
          }

          setLeads(prev => {
            if (payload.eventType === 'INSERT') {
              // Only add if not already in the list
              if (prev.some(lead => lead.id === updatedLead.id)) {
                return prev;
              }
              return [...prev, payload.new as Lead];
            } else if (payload.eventType === 'UPDATE') {
              return prev.map(lead => 
                lead.id === (payload.new as Lead).id ? payload.new as Lead : lead
              );
            } else if (payload.eventType === 'DELETE') {
              return prev.filter(lead => 
                lead.id !== (payload.old as { id: string }).id
              );
            }
            return prev;
          });
        }
      )
      .subscribe();

    // Initial fetch - only when component mounts or user changes
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leads based on user's role
        let query = supabase.from('leads').select('*');
        
        // If not admin, only fetch user's leads
        if (!currentUser.is_admin) {
          query = query.eq('owner_id', currentUser.id);
        }
        
        const { data: leadsData, error: leadsError } = await query;
        
        if (leadsError) {
          throw leadsError;
        }
        
        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*');
        
        if (notesError) {
          throw notesError;
        }
        
        setLeads(leadsData || []);
        setNotes(notesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error fetching data",
          description: "Failed to load leads and notes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id, currentUser?.is_admin, isEditModalOpen]);

  // Update todo items whenever leads change - fixed dependencies
  useEffect(() => {
    if (!currentUser?.id || !leads.length) return;
    
    const newTodoItems: TodoItem[] = [];
    
    leads.forEach(lead => {
      // Only consider leads assigned to the current user
      if (lead.owner_id === currentUser.id) {
        // Check for follow-ups due today
        if (lead.next_follow_up) {
          const followUpDate = parseISO(lead.next_follow_up);
          if (isToday(followUpDate)) {
            newTodoItems.push({
              id: `follow-up-${lead.id}`,
              leadId: lead.id,
              contactName: lead.contact_name,
              businessName: lead.business_name || '',
              dueDate: lead.next_follow_up,
              completed: false, // Always start as not completed
              type: 'follow-up'
            });
          }
        }
        
        // Check for demos scheduled today
        if (lead.demo_date) {
          const demoDate = parseISO(lead.demo_date);
          if (isToday(demoDate)) {
            const demoTime = format(demoDate, 'h:mm a');
            
            newTodoItems.push({
              id: `demo-${lead.id}`,
              leadId: lead.id,
              contactName: lead.contact_name,
              businessName: lead.business_name || '',
              dueDate: lead.demo_date,
              completed: false, // Always start as not completed
              type: 'demo',
              time: demoTime
            });
          }
        }
      }
    });
    
    // Update todo items, preserving completed status for existing items
    setTodoItems(prev => {
      const completedItems = prev.filter(item => item.completed === true);
      const completedItemIds = new Set(completedItems.map(item => item.id));
      
      // Only add new items that haven't been completed yet
      const filteredNewItems = newTodoItems.filter(newItem => 
        !completedItemIds.has(newItem.id)
      );
      
      console.log('Todo items update - Completed items preserved:', completedItems.length);
      console.log('Todo items update - New items added:', filteredNewItems.length);
      
      return [...completedItems, ...filteredNewItems];
    });
  }, [leads, currentUser?.id]);

  // Get the number of active todo items for the current user
  const activeTodoCount = useMemo(() => {
    const count = todoItems.filter(item => item.completed === false).length;
    console.log('Active todo count:', count);
    return count;
  }, [todoItems]);

  // Get the number of pending kickoff calls for the current user
  const pendingKickoffCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    
    const count = leads.filter(lead => {
      // Only consider leads assigned to the current user or if user is admin
      const isUserLead = lead.owner_id === currentUser.id;
      const isAdmin = currentUser.is_admin;
      
      return (isUserLead || isAdmin) && 
             lead.status === 'Closed' && 
             lead.kickoff_completed === false; // Explicitly check for false
    }).length;
    
    console.log('Pending kickoff count:', count);
    return count;
  }, [leads, currentUser?.id, currentUser?.is_admin]);
  
  // Count leads by status
  const leadStatusCounts = useMemo(() =>
    leads.reduce((acc, lead) => {
      if (!acc[lead.status]) acc[lead.status] = 0;
      acc[lead.status]++;
      return acc;
    }, {} as Record<string, number>),
    [leads]
  );
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  console.log('Mapped lead data:', { selectedLead, appSelectedLead });
  
  // Map Supabase profiles to App users
  const appUsers: User[] = users.map(profile => ({
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    isAdmin: profile.is_admin,
    commissionRules: Array.isArray(profile.commission_rules) ? profile.commission_rules.map((rule: any) => ({
      threshold: rule.threshold || 0,
      amount: rule.amount || 0
    })) : []
  }));
  
  // Map current user to App user format
  const appCurrentUser: User = {
    id: currentUser?.id || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    isAdmin: currentUser?.is_admin || false,
    commissionRules: Array.isArray(currentUser?.commission_rules) ? currentUser.commission_rules.map((rule: any) => ({
      threshold: rule.threshold || 0,
      amount: rule.amount || 0
    })) : []
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Prosperly Lead View</h1>
              <div className="flex gap-2 mt-2">
                {Object.entries(leadStatusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className={
                    status === 'Demo Scheduled' ? 'bg-white border' : 
                    status === 'Warm' ? 'bg-blue-50' :
                    status === 'Hot' ? 'bg-red-50' :
                    status === 'Closed' ? 'bg-green-50' : ''
                  }>
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser?.is_admin && (
                <UserManagement 
                  users={appUsers}
                  onAddUser={onAddUser}
                  onUpdateUser={onUpdateUser}
                  onDeleteUser={onDeleteUser}
                  currentUser={appCurrentUser}
                />
              )}
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={() => setIsTodoListOpen(true)}
              >
                <ListTodo className="h-4 w-4" /> 
                <span>Items For Today</span>
                {activeTodoCount > 0 && (
                  <span className="ml-1 text-red-500 font-medium">
                    ({activeTodoCount})
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={() => setIsKickoffListOpen(true)}
              >
                <UserCheck className="h-4 w-4" /> 
                <span>Kickoff Calls</span>
                {pendingKickoffCount > 0 && (
                  <span className="ml-1 text-red-500 font-medium">
                    ({pendingKickoffCount})
                  </span>
                )}
              </Button>
              <UserNavbar />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <div className="flex justify-between mb-4">
          <div>
            {currentUser?.is_admin && <CalendlySync onSyncComplete={triggerRefresh} />}
          </div>
          <AddLeadDialog 
            onAddLead={handleAddLead}
            users={appUsers}
            currentUser={appCurrentUser} 
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <LeadList 
              leads={leads}
              selectedLeadId={selectedLeadId}
              onLeadSelect={handleLeadSelect}
              onEditLead={handleEditLead}
              onAddLead={() => {}} // This will be replaced by AddLeadDialog
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusFilterChange}
              selectedUserId={selectedUserId}
              onUserChange={handleUserFilterChange}
              onUsersLoaded={handleUsersLoaded}
              selectedDateFilter={selectedDateFilter}
              onDateFilterChange={setSelectedDateFilter}
              selectedDateField={selectedDateField}
              onDateFieldChange={setSelectedDateField}
            />
          </div>
          <div className="border-l pl-6">
            <NoteSection 
              lead={selectedLead ? mapSupabaseLeadToAppLead(selectedLead) : null}
              notes={notes.filter(note => note.lead_id === selectedLeadId)}
              onAddNote={handleAddNote}
              onStatusChange={handleStatusChange}
              onEditLead={handleEditLead}
            />
          </div>
        </div>
      </main>

      {/* Use the EditLeadDialog component */}
      {appSelectedLead && (
        <EditLeadDialog
          lead={appSelectedLead}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          users={appUsers}
          currentUser={appCurrentUser} 
        />
      )}
      
      <TodoList
        isOpen={isTodoListOpen}
        onClose={() => setIsTodoListOpen(false)}
        todoItems={todoItems}
        onMarkComplete={handleMarkTodoComplete}
        onViewLead={(leadId) => {
          setSelectedLeadId(leadId);
          setIsTodoListOpen(false);
        }}
        currentUser={currentUser}
      />

      <KickoffList
        isOpen={isKickoffListOpen}
        onClose={() => setIsKickoffListOpen(false)}
        leads={leads}
        onMarkComplete={handleMarkKickoffComplete}
        onViewLead={(leadId) => {
          setSelectedLeadId(leadId);
          setIsKickoffListOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
