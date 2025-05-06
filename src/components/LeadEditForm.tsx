
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, User, LeadStatus } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, UserRound, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  // Initialize form data when lead changes
  React.useEffect(() => {
    if (lead) {
      setFormData(lead);
    }
  }, [lead]);
  
  // Watch for status changes to update closedAt date
  useEffect(() => {
    if (formData.status === 'Closed' && lead && lead.status !== 'Closed') {
      setFormData(prev => ({
        ...prev,
        closedAt: new Date().toISOString().split('T')[0]
      }));
    }
  }, [formData.status, lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'setupFee' || name === 'mrr' ? Number(value) : value
    }));
  };

  const handleStatusChange = (status: LeadStatus) => {
    const updates: Partial<Lead> = { status };
    
    // Set closedAt date when status changes to Closed
    if (status === 'Closed' && (!lead?.closedAt || lead.status !== 'Closed')) {
      updates.closedAt = new Date().toISOString().split('T')[0];
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lead && formData) {
      onSave({ ...lead, ...formData });
      onClose();
    }
  };

  const handleDelete = () => {
    if (lead) {
      onDelete(lead.id);
      setDeleteDialogOpen(false);
      onClose();
    }
  };

  const handleOwnerChange = (ownerId: string) => {
    setFormData(prev => ({ ...prev, ownerId }));
  };

  // Improved date handling function
  const handleDateChange = (field: string, date: Date | undefined) => {
    console.log(`Date selected for ${field}:`, date);
    
    if (!date) {
      setFormData(prev => {
        const updated = { ...prev };
        updated[field] = null;
        return updated;
      });
      return;
    }
    
    // Format consistently as YYYY-MM-DD, avoiding time zone issues
    const formattedDate = date.toISOString().split('T')[0];
    console.log(`Formatted date for ${field}:`, formattedDate);
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedDate
    }));
  };

  if (!lead) return null;

  // Only admin or the lead owner can edit ownership
  const canEditOwnership = currentUser.isAdmin;

  // Parse a date string to a Date object for the calendar
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    
    try {
      // For YYYY-MM-DD format strings
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateString + 'T12:00:00'); // Add noon time to avoid timezone issues
      }
      
      // For ISO strings or other formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.error("Error parsing date:", dateString);
    }
    
    return undefined;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="contactName">Contact Name</label>
            <Input 
              id="contactName"
              name="contactName"
              value={formData.contactName || ''}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email || ''}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="businessName">Business Name</label>
            <Input 
              id="businessName"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="crm">CRM System</label>
            <Input 
              id="crm"
              name="crm"
              value={formData.crm || ''}
              onChange={handleChange}
              placeholder="e.g. Salesforce, HubSpot, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="leadSource">Lead Source</label>
            <Input 
              id="leadSource"
              name="leadSource"
              value={formData.leadSource || ''}
              onChange={handleChange}
            />
          </div>
          
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Lead Status</label>
            <Select 
              value={formData.status} 
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
            <div>
              <label className="block text-sm font-medium mb-1">Demo Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.demoDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.demoDate ? (
                      format(parseDate(formData.demoDate) as Date, 'PPP')
                    ) : (
                      <span>Select demo date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={parseDate(formData.demoDate)}
                    onSelect={(date) => handleDateChange('demoDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Signup Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.signupDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formData.signupDate ? (
                      format(parseDate(formData.signupDate) as Date, 'PPP')
                    ) : (
                      <span>Select signup date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={parseDate(formData.signupDate)}
                    onSelect={(date) => handleDateChange('signupDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nextFollowUp">Next Follow-Up</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.nextFollowUp && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.nextFollowUp ? (
                    format(parseDate(formData.nextFollowUp) as Date, 'PPP')
                  ) : (
                    <span>Schedule follow-up</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={parseDate(formData.nextFollowUp)}
                  onSelect={(date) => handleDateChange('nextFollowUp', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="setupFee">Setup Fee ($)</label>
              <Input 
                id="setupFee"
                name="setupFee"
                type="number"
                value={formData.setupFee || 0}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mrr">MRR ($)</label>
              <Input 
                id="mrr"
                name="mrr"
                type="number"
                value={formData.mrr || 0}
                onChange={handleChange}
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
