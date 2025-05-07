
import React, { useState, useEffect } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [formKey, setFormKey] = useState(Date.now());
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  
  // Reset form key when dialog opens to force re-render with fresh data
  // Add back the lead dependency to ensure the form is updated when lead changes
  useEffect(() => {
    if (isOpen && lead) {
      console.log('Dialog opened with lead data:', lead);
      setCurrentLead(lead);
      setFormKey(Date.now());
    }
  }, [isOpen, lead]);  // Depend on both isOpen and lead

  const handleSubmit = async (formData: Partial<Lead>) => {
    if (!isOpen) return; // Prevent submission if dialog is closing/closed
    
    try {
      setIsSubmitting(true);
      console.log('Form data before update:', formData);
      console.log('Current lead data:', currentLead);
      
      // Create updated lead object with proper type handling
      const updatedLead: Lead = {
        ...currentLead,
        ...formData,
        setupFee: typeof formData.setupFee === 'number' ? formData.setupFee : currentLead.setupFee,
        mrr: typeof formData.mrr === 'number' ? formData.mrr : currentLead.mrr,
        value: typeof formData.value === 'number' ? formData.value : currentLead.value,
      };
      
      console.log('Updated lead:', updatedLead);
      
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
  };

  const handleDelete = async () => {
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
  };

  // Safe close function that checks submission state
  const handleDialogClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

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
