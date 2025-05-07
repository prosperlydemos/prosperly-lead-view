
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lead, User, LeadStatus } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import LeadFormFields from './LeadFormFields';

interface LeadEditFormProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
  onDelete: (leadId: string) => void;
  users: User[];
  currentUser: User;
}

const LeadEditForm: React.FC<LeadEditFormProps> = ({ 
  lead, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  users,
  currentUser
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Initialize form data when lead changes or dialog opens
  useEffect(() => {
    if (lead && isOpen) {
      console.log("Loading lead data:", lead);
      // Deep clone to avoid reference issues
      setFormData(JSON.parse(JSON.stringify(lead)));
    }
  }, [lead, isOpen]);

  // Generic field change handler for text and numeric fields
  const handleFieldChange = (field: string, value: any) => {
    console.log(`Field ${field} changed to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle status change
  const handleStatusChange = (status: LeadStatus) => {
    console.log(`Status changed to: ${status}`);
    
    setFormData(prev => {
      const updates: Partial<Lead> = { ...prev, status };
      
      // If changing to Closed status, update closedAt and signupDate
      if (status === 'Closed' && (!prev.closedAt || prev.status !== 'Closed')) {
        const now = new Date().toISOString();
        updates.closedAt = now;
        updates.signupDate = now;
      }
      
      return updates;
    });
  };

  // Handle owner change
  const handleOwnerChange = (ownerId: string) => {
    console.log(`Owner changed to: ${ownerId}`);
    handleFieldChange('ownerId', ownerId);
  };

  // Handle date change
  const handleDateChange = (fieldName: string, value: string | null) => {
    console.log(`Setting ${fieldName} with value:`, value);
    
    setFormData(prev => {
      const updates = { ...prev, [fieldName]: value };
      
      // Synchronize signupDate and closedAt for closed leads
      if (fieldName === 'signupDate' && prev.status === 'Closed') {
        updates.closedAt = value;
      } 
      else if (fieldName === 'closedAt' && prev.status === 'Closed') {
        updates.signupDate = value;
      }
      
      return updates;
    });
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (lead && formData) {
      try {
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
        
        onSave(updatedLead);
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
      }
    }
  };

  // Delete lead
  const handleDelete = () => {
    if (lead) {
      onDelete(lead.id);
      setDeleteDialogOpen(false);
      onClose();
    }
  };

  if (!lead) return null;

  // Only admin can edit ownership
  const canEditOwnership = currentUser.isAdmin;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <LeadFormFields 
            formData={formData}
            onChange={handleFieldChange}
            onStatusChange={handleStatusChange}
            onOwnerChange={handleOwnerChange}
            onDateChange={handleDateChange}
            users={users}
            currentUser={currentUser}
            canEditOwnership={canEditOwnership}
          />
          
          <DialogFooter className="flex justify-between items-center pt-4">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 size={16} className="mr-1" />
                  Delete Contact
                </Button>
              </AlertDialogTrigger>
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
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadEditForm;
