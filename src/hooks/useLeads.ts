
import { useState } from 'react';
import { Lead, Note, mapSupabaseLeadToAppLead, mapAppLeadToSupabaseLead } from '../types/supabase';
import { Lead as AppLead, LeadStatus } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export const useLeads = (
  initialLeads: Lead[] = [],
  initialNotes: Note[] = [],
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'All'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');

  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId) 
    : null;

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  const handleAddNote = async (leadId: string, content: string, currentUserId: string) => {
    try {
      const newNote = {
        lead_id: leadId,
        user_id: currentUserId,
        content
      };
      
      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single();
        
      if (error) throw error;
      
      setNotes(prev => [...prev, data]);
      
      toast({
        title: "Note added",
        description: "Your note has been saved successfully."
      });

      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error adding note",
        description: "Failed to save your note",
        variant: "destructive"
      });
      throw error;
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

  const handleAddLead = async (newLeadData: Omit<AppLead, 'id'>) => {
    try {
      // Prepare data for Supabase
      const supabaseNewLead = mapAppLeadToSupabaseLead({
        ...newLeadData as AppLead,
        id: '' // Placeholder ID that will be replaced by Supabase
      });
      
      const { data, error } = await supabase
        .from('leads')
        .insert(supabaseNewLead)
        .select()
        .single();
        
      if (error) throw error;
      
      setLeads(prev => [...prev, data]);
      
      return data;
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error adding lead",
        description: "Failed to add new lead",
        variant: "destructive"
      });
      throw error;
    }
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
      
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error updating lead",
        description: "Failed to update the lead information",
        variant: "destructive"
      });
      throw error;
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
      throw error;
    }
  };
  
  const handleStatusFilterChange = (status: LeadStatus | 'All') => {
    setSelectedStatus(status);
  };
  
  const handleUserFilterChange = (userId: string | 'all') => {
    setSelectedUserId(userId);
  };

  // Convert Supabase leads to App leads for LeadEditForm
  const appSelectedLead = selectedLead ? mapSupabaseLeadToAppLead(selectedLead) : null;

  return {
    leads,
    setLeads,
    selectedLeadId,
    setSelectedLeadId,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedStatus,
    selectedUserId,
    selectedLead,
    appSelectedLead,
    handleLeadSelect,
    handleAddNote,
    handleStatusChange,
    handleEditLead,
    handleAddLead,
    handleSaveLead,
    handleDeleteLead,
    handleStatusFilterChange,
    handleUserFilterChange
  };
};
