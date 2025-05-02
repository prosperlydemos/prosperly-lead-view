
import React, { useState } from 'react';
import LeadList from '../components/LeadList';
import NoteSection from '../components/NoteSection';
import LeadEditForm from '../components/LeadEditForm';
import { mockLeads, mockNotes } from '../data/mockData';
import { Lead, Note } from '../types';
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <h1 className="text-2xl font-bold">Prosperly Lead View</h1>
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
      />
    </div>
  );
};

export default Index;
