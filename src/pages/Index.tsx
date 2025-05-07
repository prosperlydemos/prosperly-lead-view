
import React, { useState, useEffect } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import TodoList from '../components/TodoList';
import { Note, Lead, Profile } from '../types/supabase';
import { toast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserNavbar } from '@/components/UserNavbar';
import { User } from '../types/index';
import UserManagement from '../components/UserManagement';
import AddLeadDialog from '../components/AddLeadDialog';
import EditLeadDialog from '../components/EditLeadDialog';
import { useTodos } from '../hooks/useTodos';
import { useLeads } from '../hooks/useLeads';
import { useUserManagement } from '../hooks/useUserManagement';

const Index: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize hooks
  const { todoItems, setTodoItems, handleMarkTodoComplete, activeTodoCount } = useTodos(leads, currentUser);
  
  const { 
    selectedLeadId, setSelectedLeadId,
    isEditModalOpen, setIsEditModalOpen,
    selectedStatus, selectedUserId,
    appSelectedLead,
    handleLeadSelect, handleStatusChange, handleEditLead,
    handleAddLead, handleSaveLead, handleDeleteLead,
    handleStatusFilterChange, handleUserFilterChange
  } = useLeads(leads, notes, setNotes);

  const {
    users, setUsers,
    handleAddUser, handleUpdateUser, handleDeleteUser, 
    handleUsersLoaded
  } = useUserManagement();

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

  // Handle adding note with todo completion
  const handleAddNoteWithTodo = async (leadId: string, content: string) => {
    if (!currentUser) return;
    
    try {
      await handleAddNote(leadId, content, currentUser.id);
      
      // Mark todo item for this lead as completed when a note is added
      setTodoItems(todoItems.map(item => 
        item.leadId === leadId ? { ...item, completed: true } : item
      ));
    } catch (error) {
      console.error('Error in handleAddNoteWithTodo:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
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
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Prosperly Lead View</h1>
              <div className="flex gap-2 mt-2">
                {Object.entries(leads.reduce((acc, lead) => {
                  if (!acc[lead.status]) acc[lead.status] = 0;
                  acc[lead.status]++;
                  return acc;
                }, {} as Record<string, number>)).map(([status, count]) => (
                  <Badge key={status} variant="outline" className={
                    status === 'Demo Scheduled' ? 'bg-white border' : 
                    status === 'Warm Lead' ? 'bg-blue-50' :
                    status === 'Hot Lead' ? 'bg-red-50' :
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
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
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
              lead={appSelectedLead}
              notes={notes.filter(note => note.lead_id === selectedLeadId)}
              onAddNote={handleAddNoteWithTodo}
              onStatusChange={handleStatusChange}
              onEditLead={handleEditLead}
            />
          </div>
        </div>
      </main>

      <EditLeadDialog
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
