
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lead, User } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import LeadForm from './LeadForm';

interface EditLeadDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  onDelete: (leadId: string) => void;
  users: User[];
  currentUser: User;
}

const EditLeadDialog: React.FC<EditLeadDialogProps> = ({ 
  lead, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  users,
  currentUser
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (formData: Partial<Lead>) => {
    if (!lead) return;
    
    try {
      setIsSubmitting(true);
      
      // Create a complete lead object by merging the original lead with form updates
      const updatedLead: Lead = {
        ...lead,
        ...formData,
        // Ensure numeric fields are numbers
        setupFee: typeof formData.setupFee === 'number' ? formData.setupFee : 0,
        mrr: typeof formData.mrr === 'number' ? formData.mrr : 0,
        value: typeof formData.value === 'number' ? formData.value : 0,
      };
      
      console.log('Saving lead with data:', updatedLead);
      
      await onSave(updatedLead);
      onClose();
      
      toast({
        title: "Lead updated successfully",
        description: `Updated ${updatedLead.contactName}'s information`,
      });
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        title: "Error updating lead",
        description: "There was a problem updating the lead information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle lead deletion
  const handleDelete = () => {
    if (lead) {
      onDelete(lead.id);
      setDeleteDialogOpen(false);
      onClose();
    }
  };

  // Return null if no lead is selected
  if (!lead) return null;

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          
          <LeadForm
            initialData={lead}
            users={users}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            showDelete={true}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {lead.contactName}'s contact record and all associated notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditLeadDialog;
