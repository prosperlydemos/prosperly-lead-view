
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import LeadForm from './LeadForm';
import { Lead, User } from '../../types';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface EditLeadDialogProps {
  lead: Lead;
  users: User[];
  currentUser: User;
  onSave: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const EditLeadDialog: React.FC<EditLeadDialogProps> = ({
  lead,
  users,
  currentUser,
  onSave,
  onDelete,
  onClose,
  isOpen,
}) => {
  console.log('=== EDIT DIALOG DEBUG ===');
  console.log('1. Dialog props:', { lead, isOpen });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now());
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  
  // Only update lead data when dialog opens to prevent form resets
  useEffect(() => {
    console.log('2. Dialog effect triggered:', { isOpen, lead });
    if (isOpen) {
      console.log('Dialog opened with lead data:', lead);
      setCurrentLead(lead);
      setFormKey(Date.now());
    }
  }, [isOpen]); // Only re-run when dialog opens/closes
  
  // By removing lead.id from dependencies, we prevent the effect from running
  // when lead is updated elsewhere in the app

  const handleSubmit = useCallback(async (formData: Partial<Lead>) => {
    console.log('3. Form submission:', { formData, currentLead });
    if (!isOpen) return; // Prevent submission if dialog is closing/closed
    
    try {
      setIsSubmitting(true);
      console.log('Form data before update:', formData);
      console.log('Current lead data:', currentLead);
      
      // Create updated lead object with proper type handling and explicit date fields
      const updatedLead: Lead = {
        ...currentLead,
        ...formData,
        setupFee: typeof formData.setupFee === 'number' ? formData.setupFee : currentLead.setupFee,
        mrr: typeof formData.mrr === 'number' ? formData.mrr : currentLead.mrr,
        value: typeof formData.value === 'number' ? formData.value : currentLead.value,
        // Explicitly set date fields from formData
        demoDate: formData.demoDate ?? currentLead.demoDate,
        signupDate: formData.signupDate ?? currentLead.signupDate,
        nextFollowUp: formData.nextFollowUp ?? currentLead.nextFollowUp,
        closedAt: formData.closedAt ?? currentLead.closedAt,
      };
      
      console.log('4. Sending to parent:', updatedLead);
      
      // Save the updated lead
      await onSave(updatedLead);
      
      // Only proceed with toast and close if the component is still mounted
      if (isOpen) {
        toast({
          title: 'Lead updated successfully',
          description: `Updated ${updatedLead.contactName}'s information`,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      
      // Only show toast if the component is still mounted
      if (isOpen) {
        toast({
          title: 'Error updating lead',
          description: 'There was a problem updating the lead information',
          variant: 'destructive',
        });
      }
    } finally {
      // Only update state if the component is still mounted
      if (isOpen) {
        setIsSubmitting(false);
      }
    }
  }, [isOpen, currentLead, onSave, onClose, toast]);

  const handleDelete = useCallback(async () => {
    if (!onDelete || !lead || !isOpen) return;
    
    try {
      setIsSubmitting(true);
      await onDelete(lead.id);
      
      // Only proceed with UI updates if component is still mounted
      if (isOpen) {
        setDeleteDialogOpen(false);
        toast({
          title: 'Lead deleted',
          description: `${lead.contactName}'s information has been removed`,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      
      // Only show toast if the component is still mounted
      if (isOpen) {
        toast({
          title: 'Error deleting lead',
          description: 'There was a problem deleting the lead',
          variant: 'destructive',
        });
      }
    } finally {
      // Only update state if the component is still mounted
      if (isOpen) {
        setIsSubmitting(false);
      }
    }
  }, [isOpen, lead, onDelete, onClose, toast]);

  // Safe close function that checks submission state
  const handleDialogClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Make changes to lead information and click Save when done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between mb-4">
            {onDelete && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Lead
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {currentLead.contactName}'s contact record and all
                      associated notes. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <LeadForm
            key={formKey}
            initialData={currentLead}
            users={users}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={handleDialogClose}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditLeadDialog;
