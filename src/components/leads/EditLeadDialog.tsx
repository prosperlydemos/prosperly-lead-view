
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [formKey, setFormKey] = useState(Date.now()); // Add a key to force re-render

  // Add logging when lead data changes and reset form key when dialog opens
  useEffect(() => {
    if (lead && isOpen) {
      console.log('Loading lead data:', lead);
      setFormKey(Date.now()); // Reset form key when dialog opens to force re-render
    }
  }, [lead, isOpen]);

  const handleSubmit = async (formData: Partial<Lead>) => {
    try {
      setIsSubmitting(true);
      console.log('Form data before update:', formData);
      const updatedLead: Lead = {
        ...lead,
        ...formData,
        setupFee: typeof formData.setupFee === 'number' ? formData.setupFee : 0,
        mrr: typeof formData.mrr === 'number' ? formData.mrr : 0,
        value: typeof formData.value === 'number' ? formData.value : 0,
      };
      console.log('Updated lead:', updatedLead);
      
      await onSave(updatedLead);
      onClose();
      toast({
        title: 'Lead updated successfully',
        description: `Updated ${updatedLead.contactName}'s information`,
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error updating lead',
        description: 'There was a problem updating the lead information',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && lead) {
      try {
        await onDelete(lead.id);
        setDeleteDialogOpen(false);
        onClose();
        toast({
          title: 'Lead deleted',
          description: `${lead.contactName}'s information has been removed`,
        });
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast({
          title: 'Error deleting lead',
          description: 'There was a problem deleting the lead',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="flex justify-between mb-4">
            {onDelete && (
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
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
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <LeadForm
            key={formKey} // Add key to force re-render when lead changes
            initialData={lead}
            users={users}
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditLeadDialog;
