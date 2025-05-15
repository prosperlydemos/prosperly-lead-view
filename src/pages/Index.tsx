import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import TodoList from '../components/TodoList';
import { Note, Lead, mapSupabaseLeadToAppLead, mapAppLeadToSupabaseLead, Profile } from '../types/supabase';
import { toast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { isToday, parseISO, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserNavbar } from '@/components/UserNavbar';
import { LeadStatus, User } from '../types/index';
import UserManagement from '../components/UserManagement';
import AddLeadDialog from '@/components/leads/AddLeadDialog';
import EditLeadDialog from '@/components/leads/EditLeadDialog';
import CalendlySync from '@/components/CalendlySync';
import { DateFilterOption, DateFieldOption } from '@/components/DateRangeFilter';
import { Lead as AppLead } from '@/types';

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

  // Add effect to log when selectedLead changes
  useEffect(() => {
    console.log('Selected lead changed:', selectedLead);
  }, [selectedLead]);

  // Function to manually refresh leads data - moved up and memoized properly
  const refreshLeads = useMemo(() => async () => {
    try {
      setLoading(true);
      
      // Fetch leads based on user's role
      let query = supabase.from('leads').select('*');
      
      // If not admin, only fetch user's leads
      if (currentUser && !currentUser.is_admin) {
        query = query.eq('owner_id', currentUser.id);
      }
      
      const { data: leadsData, error: leadsError } = await query;
      
      if (leadsError) {
        throw leadsError;
      }
      
      // Map Supabase leads to application leads
      const appLeads = leadsData ? leadsData.map(lead => mapSupabaseLeadToAppLead(lead)) : [];
      setLeads(appLeads);
      
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
  }, [currentUser]);

  // Fetch leads with real-time subscription
  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time subscription
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
          // Only update if it's not the lead we're currently editing
          if (isEditModalOpen && payload.new && typeof payload.new === 'object' && 'id' in payload.new && payload.new.id === selectedLeadId) {
            console.log('Ignoring update for lead being edited:', payload.new.id);
            return;
          }

          setLeads(prev => {
            if (payload.eventType === 'INSERT') {
              return [...prev, mapSupabaseLeadToAppLead(payload.new)];
            } else if (payload.eventType === 'UPDATE') {
              return prev.map(lead => 
                lead.id === (payload.new as any).id ? mapSupabaseLeadToAppLead(payload.new) : lead
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

    // Initial fetch
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
        
        // Map Supabase leads and notes to application types
        const appLeads = leadsData ? leadsData.map(lead => mapSupabaseLeadToAppLead(lead)) : [];
        const appNotes = notesData ? notesData.map(note => ({
          id: note.id,
          leadId: note.lead_id,
          content: note.content,
          createdAt: note.created_at,
          userId: note.user_id
        })) : [];
        
        setLeads(appLeads);
        setNotes(appNotes);
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
  }, [currentUser, isEditModalOpen, selectedLeadId, refreshTrigger]);

  // Update todo items whenever leads change
  useEffect(() => {
    if (!currentUser) return;
    
    const newTodoItems: TodoItem[] = [];
    
    leads.forEach(lead => {
      // Only consider leads assigned to the current user
      if (lead.ownerId === currentUser.id) {
        // Check for follow-ups due today
        if (lead.nextFollowUp) {
          const followUpDate = parseISO(lead.nextFollowUp);
          if (isToday(followUpDate)) {
            newTodoItems.push({
              id: `follow-up-${lead.id}-${Date.now()}`,
              leadId: lead.id,
              contactName: lead.contactName,
              businessName: lead.businessName || '',
              dueDate: lead.nextFollowUp,
              completed: false,
              type: 'follow-up'
            });
          }
        }
        
        // Check for demos scheduled today
        if (lead.demoDate) {
          const demoDate = parseISO(lead.demoDate);
          if (isToday(demoDate)) {
            // Extract time from the demo_date with proper formatting
            const demoTime = format(demoDate, 'h:mm a');
            console.log(`Formatted demo time for ${lead.contactName}: ${demoTime}, original value: ${lead.demoDate}`);
            
            newTodoItems.push({
              id: `demo-${lead.id}-${Date.now()}`,
              leadId: lead.id,
              contactName: lead.contactName,
              businessName: lead.businessName || '',
              dueDate: lead.demoDate,
              completed: false,
              type: 'demo',
              time: demoTime
            });
          }
        }
      }
    });
    
    // Filter out completed items and add new ones
    const filteredItems = todoItems.filter(item => 
      !item.completed && 
      !newTodoItems.some(newItem => newItem.leadId === item.leadId && newItem.type === item.type)
    );
    
    setTodoItems([...filteredItems, ...newTodoItems]);
  }, [leads, currentUser, todoItems]);

  // Modified handleLeadSelect to ensure it doesn't cause page refreshes
  const handleLeadSelect = useCallback((leadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Lead selected in Index:', leadId);
    // Prevent any default behavior that might be causing refreshes
    setSelectedLeadId(leadId);
  }, []);

  const handleAddNote = useCallback(async (leadId: string, content: string) => {
    if (!currentUser) return;
    
    try {
      const newNote = {
        lead_id: leadId,
        user_id: currentUser.id,
        content
      };
      
      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert the Supabase note to our application note format
      const appNote: Note = {
        id: data.id,
        leadId: data.lead_id, // Map lead_id from Supabase to leadId in our app
        content: data.content,
        createdAt: data.created_at,
        userId: data.user_id
      };
      
      setNotes(prev => [...prev, appNote]);
      
      // Mark todo item for this lead as completed when a note is added
      setTodoItems(todoItems.map(item => 
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
  }, [currentUser, setNotes, todoItems, setTodoItems]);

  const handleStatusChange = useCallback(async (leadId: string, status: LeadStatus) => {
    try {
      // If changing to Closed status, update the closing_date
      const updates: Partial<any> = { status };
      
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
      
      // Convert the Supabase lead to our application lead format
      const appLead = mapSupabaseLeadToAppLead(data);
      
      setLeads(prev => 
        prev.map(lead => lead.id === leadId ? appLead : lead)
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
  }, [setLeads]);

  // Modified handleEditLead to ensure it doesn't cause page refreshes
  const handleEditLead = useCallback((leadId: string) => {
    console.log('Edit lead clicked:', leadId);
    // Set the selected lead ID first
    setSelectedLeadId(leadId);
    // Then open the modal
    setIsEditModalOpen(true);
  }, []);

  const handleSaveLead = useCallback(async (updatedLead: AppLead) => {
    try {
      const supabaseUpdatedLead = mapAppLeadToSupabaseLead(updatedLead);
      
      // Ensure commission_amount is properly handled
      if (typeof updatedLead.commissionAmount === 'number') {
        supabaseUpdatedLead.commission_amount = updatedLead.commissionAmount;
      }
      
      const { data, error } = await supabase
        .from('leads')
        .update(supabaseUpdatedLead)
        .eq('id', updatedLead.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert the Supabase data to our app Lead type
      const appLead = mapSupabaseLeadToAppLead(data);
      
      // Update the leads array
      setLeads(prev => 
        prev.map(lead => lead.id === updatedLead.id ? appLead : lead)
      );
      
      // Update the selected lead if it's the one being edited
      if (selectedLeadId === updatedLead.id) {
        setSelectedLeadId(updatedLead.id);
      }
      
      // Close the modal
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
  }, [selectedLeadId]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
        
      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      // Notes will be automatically deleted due to cascade delete
      setNotes(prev => prev.filter(note => note.leadId !== leadId));
      
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
  }, [selectedLeadId, setLeads, setNotes, setSelectedLeadId]);
  
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
    setTodoItems(todoItems.map(item => 
      item.id === todoId ? { ...item, completed: true } : item
    ));
    
    toast({
      title: "Task completed",
      description: "Follow-up task marked as completed."
    });
  }, [todoItems, setTodoItems]);
  
  // Get the number of active todo items for the current user
  const activeTodoCount = useMemo(() => 
    todoItems.filter(item => !item.completed).length,
    [todoItems]
  );
  
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

  // Trigger a refresh of leads
  const triggerRefresh = () => {
    refreshLeads();
    setRefreshTrigger(prev => prev + 1); // Force re-fetch by updating trigger value
  };
  
  console.log('Mapped lead data:', { selectedLead, appSelectedLead });
  
  // Map Supabase profiles to App users
  const appUsers: User[] = users.map(profile => ({
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    isAdmin: profile.is_admin
  }));
  
  // Map current user to App user format
  const appCurrentUser: User = {
    id: currentUser?.id || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    isAdmin: currentUser?.is_admin || false
  };
  
  const handleAddLead = async (newLead: Omit<AppLead, 'id'>) => {
    if (!currentUser) return;
    
    try {
      // Ensure all required fields are set for Supabase schema
      const leadToInsert = {
        ...newLead as AppLead,
        id: undefined, // Let Supabase generate the ID
        contactName: newLead.contactName || 'New Contact', // Ensure this is never empty
        status: newLead.status || 'Demo Scheduled' as LeadStatus, // Ensure status is set
        ownerId: newLead.ownerId || currentUser.id, // Ensure owner is set
        value: newLead.value || (newLead.mrr ? newLead.mrr * 12 : 0) // Calculate value if not provided
      };
      
      const supabaseNewLead = mapAppLeadToSupabaseLead(leadToInsert);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(supabaseNewLead)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert returned Supabase data to our app Lead type before adding to state
      setLeads(prev => [...prev, mapSupabaseLeadToAppLead(data)]);
      
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
  };

  const onAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        email_confirm: true,
        user_metadata: { name: userData.name, is_admin: userData.isAdmin }
      });
      
      if (error) throw error;
      
      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*');
        
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
      
      return data.user;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error adding user",
        description: `Failed to add user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const onUpdateUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: updatedUser.name,
          is_admin: updatedUser.isAdmin
        })
        .eq('id', updatedUser.id);
        
      if (error) throw error;
      
      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*');
        
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error updating user",
        description: `Failed to update user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  const onDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) throw error;
      
      // Refresh users list
      const { data: updatedUsers } = await supabase
        .from('profiles')
        .select('*');
        
      if (updatedUsers) {
        setUsers(updatedUsers);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: `Failed to delete user: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
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
              notes={notes.filter(note => note.leadId === selectedLeadId)}
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
    </div>
  );
};

export default Index;
