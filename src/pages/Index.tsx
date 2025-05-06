
import React, { useState, useEffect } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import LeadEditForm from '../components/LeadEditForm';
import TodoList from '../components/TodoList';
import { Note, Lead, mapSupabaseLeadToAppLead, mapAppLeadToSupabaseLead, Profile } from '../types/supabase';
import { toast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserNavbar } from '@/components/UserNavbar';
import { Lead as AppLead, LeadStatus, User } from '../types/index';
import AddLeadButton from '../components/AddLeadButton';
import UserManagement from '../components/UserManagement';

interface TodoItem {
  id: string;
  leadId: string;
  contactName: string;
  businessName: string;
  dueDate: string;
  completed: boolean;
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

  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId) 
    : null;

  // Fetch leads and notes
  useEffect(() => {
    const fetchData = async () => {
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
  }, [currentUser]);

  // Update todo items whenever leads change
  useEffect(() => {
    if (!currentUser) return;
    
    const newTodoItems: TodoItem[] = [];
    
    leads.forEach(lead => {
      // Only consider leads assigned to the current user
      if (lead.owner_id === currentUser.id && lead.next_follow_up) {
        // Check if the next follow-up is today
        const followUpDate = parseISO(lead.next_follow_up);
        if (isToday(followUpDate)) {
          newTodoItems.push({
            id: `todo-${lead.id}-${Date.now()}`,
            leadId: lead.id,
            contactName: lead.contact_name,
            businessName: lead.business_name || '',
            dueDate: lead.next_follow_up,
            completed: false
          });
        }
      }
    });
    
    // Filter out completed items and add new ones
    const filteredItems = todoItems.filter(item => 
      !item.completed && 
      !newTodoItems.some(newItem => newItem.leadId === item.leadId)
    );
    
    setTodoItems([...filteredItems, ...newTodoItems]);
  }, [leads, currentUser]);

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const handleAddNote = async (leadId: string, content: string) => {
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
      
      setNotes(prev => [...prev, data]);
      
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
  };

  const handleStatusChange = async (leadId: string, status: string) => {
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
  };

  const handleEditLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsEditModalOpen(true);
  };

  const handleSaveLead = async (updatedLead: AppLead) => {
    try {
      const supabaseUpdatedLead = mapAppLeadToSupabaseLead(updatedLead);
      
      const { data, error } = await supabase
        .from('leads')
        .update(supabaseUpdatedLead)
        .eq('id', updatedLead.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setLeads(prev => 
        prev.map(lead => lead.id === updatedLead.id ? data : lead)
      );
      
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
  };
  
  const handleDeleteLead = async (leadId: string) => {
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
  };
  
  const handleStatusFilterChange = (status: LeadStatus | 'All') => {
    setSelectedStatus(status);
  };
  
  const handleUserFilterChange = (userId: string | 'all') => {
    setSelectedUserId(userId);
  };

  const handleUsersLoaded = (loadedUsers: Profile[]) => {
    setUsers(loadedUsers);
  };
  
  const handleMarkTodoComplete = (todoId: string) => {
    setTodoItems(todoItems.map(item => 
      item.id === todoId ? { ...item, completed: true } : item
    ));
    
    toast({
      title: "Task completed",
      description: "Follow-up task marked as completed."
    });
  };
  
  // Get the number of active todo items for the current user
  const activeTodoCount = todoItems.filter(
    item => !item.completed && item.leadId
  ).length;
  
  // Count leads by status
  const leadStatusCounts = leads.reduce((acc, lead) => {
    if (!acc[lead.status]) acc[lead.status] = 0;
    acc[lead.status]++;
    return acc;
  }, {} as Record<string, number>);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Convert Supabase leads to App leads for LeadEditForm
  const appSelectedLead = selectedLead ? mapSupabaseLeadToAppLead(selectedLead) : null;
  
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
        <div className="flex justify-end mb-4">
          <AddLeadButton 
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
              onAddLead={() => {}} // This will be replaced by AddLeadButton
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusFilterChange}
              selectedUserId={selectedUserId}
              onUserChange={handleUserFilterChange}
              onUsersLoaded={handleUsersLoaded}
            />
          </div>
          <div className="border-l pl-6">
            <NoteSection 
              lead={selectedLead}
              notes={notes.filter(note => note.lead_id === selectedLeadId)}
              onAddNote={handleAddNote}
              onStatusChange={handleStatusChange}
              onEditLead={handleEditLead}
            />
          </div>
        </div>
      </main>

      <LeadEditForm
        lead={appSelectedLead}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        users={appUsers}
        currentUser={appCurrentUser} 
      />
      
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
