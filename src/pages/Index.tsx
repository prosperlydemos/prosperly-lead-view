
import React, { useState } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import LeadEditForm from '../components/LeadEditForm';
import { mockLeads, mockNotes } from '../data/mockData';
import { Lead, Note, User, LeadStatus } from '../types';
import { toast } from "@/components/ui/use-toast";
import { Badge } from '@/components/ui/badge';

const Index = () => {
  // Create a mock admin user for the initial state
  const initialCurrentUser: User = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true
  };
  
  // Initialize mock users with the admin user
  const initialUsers = [initialCurrentUser];
  
  // Update mock leads to assign them to the admin user
  const initialLeads = mockLeads.map(lead => ({
    ...lead,
    ownerId: initialCurrentUser.id
  }));
  
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialCurrentUser);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'All'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');

  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId) 
    : null;

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
    toast({
      title: "Note added",
      description: "Your note has been saved successfully."
    });
  };

  const handleStatusChange = (leadId: string, status: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: status as Lead['status'] } 
        : lead
    ));
    
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
    setIsEditModalOpen(false);
    
    toast({
      title: "Lead updated",
      description: "Lead information has been updated successfully."
    });
  };
  
  const handleAddLead = (leadData: Omit<Lead, 'id'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`
    };
    
    setLeads([...leads, newLead]);
    
    toast({
      title: "Lead added",
      description: "New lead has been added successfully."
    });
  };
  
  const handleDeleteLead = (leadId: string) => {
    setLeads(leads.filter(lead => lead.id !== leadId));
    setNotes(notes.filter(note => note.leadId !== leadId));
    
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
    }
    
    toast({
      title: "Lead deleted",
      description: "Lead and associated notes have been deleted."
    });
  };
  
  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`
    };
    
    setUsers([...users, newUser]);
  };
  
  const handleStatusFilterChange = (status: LeadStatus | 'All') => {
    setSelectedStatus(status);
  };
  
  const handleUserFilterChange = (userId: string | 'all') => {
    setSelectedUserId(userId);
  };
  
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
      </header>
      
      <main className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <LeadList 
              leads={leads}
              selectedLeadId={selectedLeadId}
              onLeadSelect={handleLeadSelect}
              onEditLead={handleEditLead}
              onAddLead={handleAddLead}
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
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
    </div>
  );
};

export default Index;
