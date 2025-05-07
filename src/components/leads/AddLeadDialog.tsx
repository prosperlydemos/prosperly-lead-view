
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import LeadForm from './LeadForm';
import { Lead, User } from '../../types';
import { useToast } from '@/hooks/use-toast';

interface AddLeadDialogProps {
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
  users: User[];
  currentUser: User;
}

const AddLeadDialog: React.FC<AddLeadDialogProps> = ({
  onAddLead,
  users,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: Partial<Lead>) => {
    try {
      setIsSubmitting(true);
      await onAddLead(formData as Omit<Lead, 'id'>);
      setIsOpen(false);
      toast({
        title: 'Lead added successfully',
        description: `Added ${formData.contactName}'s information`,
      });
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error adding lead',
        description: 'There was a problem adding the lead information',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <LeadForm
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
