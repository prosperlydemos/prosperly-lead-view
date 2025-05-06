import React, { useState, useEffect } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import LeadEditForm from '../components/LeadEditForm';
import TodoList from '../components/TodoList';
import { mockLeads, mockNotes } from '../data/mockData';
import { Lead, Note, User, LeadStatus } from '../types';
import { toast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart, ListTodo } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

interface TodoItem {
  id: string;
  leadId: string;
  contactName: string;
  businessName: string;
  dueDate: string;
  completed: boolean;
}

interface IndexProps {
  users: User[];
  currentUser: User;
  leads: Lead[];
  onAddUser: (userData: Omit<User, 'id'>) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onAddLead: (leadData: Omit<Lead, 'id'>) => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

const Index: React.FC<IndexProps> = ({ 
  users, 
  currentUser, 
  leads: initialLeads, 
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddLead,
  onUpdateLead,
  onDeleteLead
}) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'All'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId) 
    : null;

  // Update todo items whenever leads change
  useEffect(() => {
    const newTodoItems: TodoItem[] = [];
    
    leads.forEach(lead => {
      // Only consider leads assigned to the current user
      if (lead.ownerId === currentUser.id && lead.nextFollowUp) {
        // Check if the next follow-up is today
        const followUpDate = parseISO(lead.nextFollowUp);
        if (isToday(followUpDate)) {
          newTodoItems.push({
            id: `todo-${lead.id}-${Date.now()}`,
            leadId: lead.id,
            contactName: lead.contactName,
            businessName: lead.businessName || '',
            dueDate: lead.nextFollowUp,
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
  }, [leads, currentUser.id]);

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const handleAddNote = (leadId: string, content: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      leadId,
      content,
      createdAt: new Date().toISOString()
    };
    
    setNotes([...notes, newNote]);
    
    // Mark todo item for this lead as completed when a note is added
    setTodoItems(todoItems.map(item => 
      item.leadId === leadId ? { ...item, completed: true } : item
    ));
    
    toast({
      title: "Note added",
      description: "Your note has been saved successfully."
    });
  };

  const handleStatusChange = (leadId: string, status: string) => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        // If changing to Closed status, update the signupDate
        const updates: Partial<Lead> = { 
          status: status as Lead['status']
        };
        
        if (status === 'Closed' && !lead.signupDate) {
          const now = new Date().toISOString();
          updates.signupDate = now;
          updates.closedAt = now;
        }
        
        return { ...lead, ...updates };
      }
      return lead;
    });
    
    setLeads(updatedLeads);
    onUpdateLead(updatedLeads.find(lead => lead.id === leadId) as Lead);
    
    toast({
      title: "Status updated",
      description: `Lead status changed to ${status}`
    });
  };

  const handleEditLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsEditModalOpen(true);
  };

  const handleSaveLead = (updatedLead: Lead) => {
    setLeads(leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    ));
    onUpdateLead(updatedLead);
    setIsEditModalOpen(false);
    
    toast({
      title: "Lead updated",
      description: "Lead information has been updated successfully."
    });
  };
  
  const handleDeleteLead = (leadId: string) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
    setNotes(notes.filter(note => note.leadId !== leadId));
    onDeleteLead(leadId);
    
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
    }
    
    toast({
      title: "Lead deleted",
      description: "Lead and associated notes have been deleted."
    });
  };
  
  const handleStatusFilterChange = (status: LeadStatus | 'All') => {
    setSelectedStatus(status);
  };
  
  const handleUserFilterChange = (userId: string | 'all') => {
    setSelectedUserId(userId);
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
  }, {} as Record<LeadStatus, number>);
  
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
              <Link to="/reports">
                <Button variant="outline" className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" /> Sales Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <LeadList 
              leads={leads}
              selectedLeadId={selectedLeadId}
              onLeadSelect={handleLeadSelect}
              onEditLead={handleEditLead}
              onAddLead={onAddLead}
              users={users}
              currentUser={currentUser}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusFilterChange}
              selectedUserId={selectedUserId}
              onUserChange={handleUserFilterChange}
            />
          </div>
          <div className="border-l pl-6">
            <NoteSection 
              lead={selectedLead}
              notes={notes}
              onAddNote={handleAddNote}
              onStatusChange={handleStatusChange}
              onEditLead={handleEditLead}
            />
          </div>
        </div>
      </main>

      <LeadEditForm
        lead={selectedLead}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        users={users}
        currentUser={currentUser}
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
