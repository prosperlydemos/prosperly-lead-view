
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, User, LeadStatus } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, UserRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

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
  const [formData, setFormData] = React.useState<Partial<Lead>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  
  // Initialize form data when lead changes or dialog opens
  React.useEffect(() => {
    if (lead) {
      console.log("Loading lead data:", lead);
      // Create a deep clone of the lead to avoid reference issues
      setFormData(JSON.parse(JSON.stringify(lead)));
    }
  }, [lead]);

  // Handle input change for text and number fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    console.log(`Field ${name} changed to:`, value);
    
    // For numeric fields, convert to number
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
    
    setFormData(prev => ({
      ...prev,
      ownerId
    }));
  };

  // Handle date change
  const handleDateChange = (fieldName: string, value: string) => {
    console.log(`Setting ${fieldName} with input value:`, value);
    
    let dateValue = null;
    if (value && value.trim() !== '') {
      dateValue = new Date(value).toISOString();
      console.log(`Converted ${fieldName} to:`, dateValue);
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: dateValue
    }));
    
    // Synchronize signupDate and closedAt for closed leads
    if (fieldName === 'signupDate' && formData.status === 'Closed') {
      setFormData(prev => ({
        ...prev,
        closedAt: dateValue
      }));
    } 
    else if (fieldName === 'closedAt' && formData.status === 'Closed') {
      setFormData(prev => ({
        ...prev,
        signupDate: dateValue
      }));
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lead && formData) {
      // Create a deep clone to avoid reference issues
      const updatedLead = JSON.parse(JSON.stringify(formData)) as Lead;
      
      console.log('Saving lead with data:', updatedLead);
      
      onSave(updatedLead);
      onClose();
      
      toast({
        title: "Lead updated successfully",
        description: `Updated ${updatedLead.contactName}'s information`,
      });
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

  // Only admin or the lead owner can edit ownership
  const canEditOwnership = currentUser.isAdmin;
  
  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16); // Format as YYYY-MM-DDThh:mm
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
  };

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
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="contactName">Contact Name</label>
            <Input 
              id="contactName"
              name="contactName"
              value={formData.contactName || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="businessName">Business Name</label>
            <Input 
              id="businessName"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="crm">CRM System</label>
            <Input 
              id="crm"
              name="crm"
              value={formData.crm || ''}
              onChange={handleInputChange}
              placeholder="e.g. Salesforce, HubSpot, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="leadSource">Lead Source</label>
            <Input 
              id="leadSource"
              name="leadSource"
              value={formData.leadSource || ''}
              onChange={handleInputChange}
            />
          </div>
          
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Lead Status</label>
            <Select 
              value={formData.status || 'Demo Scheduled'} 
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                <SelectItem value="Warm Lead">Warm Lead</SelectItem>
                <SelectItem value="Hot Lead">Hot Lead</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Demo Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Demo Date</label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={formatDateForInput(formData.demoDate)}
                  onChange={(e) => handleDateChange('demoDate', e.target.value)}
                  className="w-full"
                />
                {formData.demoDate && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDateChange('demoDate', '')}
                  >
                    <span className="sr-only">Clear</span>
                    <span>×</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Signup Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Signup Date</label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={formatDateForInput(formData.signupDate)}
                  onChange={(e) => handleDateChange('signupDate', e.target.value)}
                  className="w-full"
                />
                {formData.signupDate && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDateChange('signupDate', '')}
                  >
                    <span className="sr-only">Clear</span>
                    <span>×</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Next Follow-Up */}
          <div>
            <label className="block text-sm font-medium mb-1">Next Follow-Up</label>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={formatDateForInput(formData.nextFollowUp)}
                onChange={(e) => handleDateChange('nextFollowUp', e.target.value)}
                className="w-full"
              />
              {formData.nextFollowUp && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleDateChange('nextFollowUp', '')}
                >
                  <span className="sr-only">Clear</span>
                  <span>×</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="setupFee">Setup Fee ($)</label>
              <Input 
                id="setupFee"
                name="setupFee"
                type="number"
                value={formData.setupFee !== undefined ? formData.setupFee : 0}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mrr">MRR ($)</label>
              <Input 
                id="mrr"
                name="mrr"
                type="number"
                value={formData.mrr !== undefined ? formData.mrr : 0}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          {canEditOwnership && (
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <UserRound size={16} />
                Assigned To
              </label>
              <Select 
                value={formData.ownerId || ''} 
                onValueChange={handleOwnerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.id === currentUser.id ? '(You)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
