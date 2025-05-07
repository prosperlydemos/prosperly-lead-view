
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lead, User, LeadStatus } from '../types';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import LeadForm from './LeadForm';

interface AddLeadDialogProps {
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
  users: User[];
  currentUser: User;
}

const AddLeadDialog: React.FC<AddLeadDialogProps> = ({ 
  onAddLead, 
  users, 
  currentUser 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialData: Partial<Lead> = {
    contactName: '',
    email: '',
    businessName: '',
    leadSource: '',
    setupFee: 0,
    mrr: 0,
    demoDate: null,
    signupDate: null,
    status: 'Demo Scheduled' as LeadStatus,
    ownerId: currentUser.id,
    crm: '',
    nextFollowUp: null,
    value: 0
  };

  const handleSubmit = async (formData: Partial<Lead>) => {
    try {
      setIsSubmitting(true);
      
      // Log what we're about to save
      console.log('Adding lead with data:', formData);
      
      await onAddLead(formData as Omit<Lead, 'id'>);
      
      toast({
        title: "Lead added",
        description: "New lead has been added successfully."
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error adding lead",
        description: "Failed to add new lead",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle size={16} className="mr-1" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        
        <LeadForm
          initialData={initialData}
          users={users}
          currentUser={currentUser}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
