
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
  
  // Update form key when dialog opens with a new lead
  useEffect(() => {
    console.log('2. Dialog effect triggered:', { isOpen, lead });
    if (isOpen && lead) {
      console.log('Dialog opened with lead data:', lead);
      setFormKey(Date.now());
    }
  }, [isOpen, lead?.id]); // Only re-run when either isOpen changes or a different lead is being edited
  
  const handleSubmit = useCallback(async (formData: Partial<Lead>) => {
    console.log('3. Form submission:', { formData, lead });
    if (!isOpen) return; // Prevent submission if dialog is closing/closed
    
    try {
      setIsSubmitting(true);
      console.log('Form data before update:', formData);
      
      // Create updated lead object with proper type handling
      const updatedLead: Lead = {
        ...lead,
        ...formData,
        // Ensure numeric fields are properly handled
        setupFee: typeof formData.setupFee === 'number' ? formData.setupFee : lead.setupFee,
        mrr: typeof formData.mrr === 'number' ? formData.mrr : lead.mrr,
        value: typeof formData.value === 'number' ? formData.value : lead.value,
        commissionAmount: typeof formData.commissionAmount === 'number' ? formData.commissionAmount : lead.commissionAmount,
        // Explicitly set date fields from formData, using undefined check to properly handle null values
        demoDate: formData.demoDate !== undefined ? formData.demoDate : lead.demoDate,
        signupDate: formData.signupDate !== undefined ? formData.signupDate : lead.signupDate,
        nextFollowUp: formData.nextFollowUp !== undefined ? formData.nextFollowUp : lead.nextFollowUp,
        closedAt: formData.closedAt !== undefined ? formData.closedAt : lead.closedAt,
      };
      
      console.log('4. Sending to parent:', updatedLead);
      
      // Save the updated lead
      await onSave(updatedLead);
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
  }, [isOpen, lead, onSave, toast]);

  const handleDeleteLead = useCallback(async () => {
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
                      This will permanently delete {lead.contactName}'s contact record and all
                      associated notes. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLead} disabled={isSubmitting}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <LeadForm
            key={formKey}
            initialData={lead}
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
