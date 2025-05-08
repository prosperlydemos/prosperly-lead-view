
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead, Profile } from '@/types/supabase';
import { mapSupabaseLeadToAppLead } from '@/types/supabase';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserNavbar } from '../components/UserNavbar';
import LeadList from '../components/LeadList';
import AddLeadDialog from '../components/leads/AddLeadDialog';
import EditLeadDialog from '../components/leads/EditLeadDialog';
import NoteSection from '../components/NoteSection';
import TodoList from '../components/TodoList';
import CalendlySync from '../components/CalendlySync';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const Index: React.FC = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Demo Scheduled' | 'Warm Lead' | 'Hot Lead' | 'Closed' | 'Lost'>('All');
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [users, setUsers] = useState<Profile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    data: leads, 
    isLoading, 
    error, 
    refetch: refetchLeads
  } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
      
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading leads...</div>;
  }

  if (error) {
    return <div className="p-8">Error loading leads: {error.message}</div>;
  }

  const handleAddLead = () => {
    setIsAddLeadOpen(true);
  };

  const handleEditLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsEditLeadOpen(true);
  };

  // Find the selected lead and map it to the app's Lead type
  const selectedLead = selectedLeadId 
    ? leads.find(lead => lead.id === selectedLeadId) 
    : null;

  const mappedSelectedLead = selectedLead 
    ? mapSupabaseLeadToAppLead(selectedLead)
    : null;

  return (
    <div className="min-h-screen bg-white">
      <UserNavbar />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Lead Management</h1>
          <Button onClick={handleAddLead} className="flex items-center">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Calendly Sync Component */}
        <CalendlySync />

        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Lead list */}
          <div className="col-span-12 lg:col-span-4">
            <LeadList 
              leads={leads}
              selectedLeadId={selectedLeadId}
              onLeadSelect={setSelectedLeadId}
              onEditLead={handleEditLead}
              onAddLead={handleAddLead}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedUserId={selectedUserId}
              onUserChange={setSelectedUserId}
              onUsersLoaded={setUsers}
            />
          </div>
          
          {/* Right section - Lead details and actions */}
          <div className="col-span-12 lg:col-span-8">
            {selectedLeadId ? (
              <Tabs defaultValue="notes">
                <TabsList className="mb-4">
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="notes">
                  <NoteSection 
                    leadId={selectedLeadId}
                    lead={selectedLead}
                  />
                </TabsContent>
                
                <TabsContent value="todos">
                  <TodoList 
                    isOpen={true}
                    onClose={() => {}}
                    todoItems={[]}
                    onMarkComplete={() => {}}
                    onViewLead={() => {}}
                    currentUser={null}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">Select a lead to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <AddLeadDialog
        onAddLead={() => {}}
        users={users}
        currentUser={{ id: '', name: '', email: '', isAdmin: false }}
      />
      
      {selectedLead && mappedSelectedLead && (
        <EditLeadDialog
          lead={mappedSelectedLead}
          users={[]}
          currentUser={{ id: '', name: '', email: '', isAdmin: false }}
          onSave={() => {
            refetchLeads();
            toast({
              title: "Lead Updated",
              description: "The lead has been successfully updated.",
            });
          }}
          onDelete={() => {}}
          onClose={() => setIsEditLeadOpen(false)}
          isOpen={isEditLeadOpen}
        />
      )}
    </div>
  );
};

export default Index;
