
import React from 'react';
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
  
  // Debug state changes
  React.useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]);

  // Initialize form data when lead changes
  React.useEffect(() => {
    if (lead) {
      // Create a deep copy to avoid reference issues
      const leadCopy = JSON.parse(JSON.stringify(lead));
      setFormData(leadCopy);
      
      // Debug initial data
      console.log("Initial lead data:", leadCopy);
    }
  }, [lead]);
  
  // Watch for status changes to update closedAt date and signupDate when status changes to Closed
  React.useEffect(() => {
    if (formData.status === 'Closed' && lead && lead.status !== 'Closed') {
      const now = new Date();
      const isoString = now.toISOString();
      
      setFormData(prev => ({
        ...prev,
        closedAt: isoString,
        signupDate: isoString // Set signup date to the same date as closedAt
      }));
    }
  }, [formData.status, lead]);

  // Parse date string to Date object
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    
    try {
      // Parse ISO string to Date
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
      console.error("Error parsing date string:", dateString, error);
      return undefined;
    }
  };

  // Standard input field handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'setupFee' || name === 'mrr' ? Number(value) : value
    }));
  };

  // Status field handler
  const handleStatusChange = (status: LeadStatus) => {
    const updates: Partial<Lead> = { status };
    
    if (status === 'Closed' && (!lead?.closedAt || lead.status !== 'Closed')) {
      const now = new Date();
      const isoString = now.toISOString();
      updates.closedAt = isoString;
      updates.signupDate = isoString; // Set signup date to the same date
    }
    
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Owner change handler
  const handleOwnerChange = (ownerId: string) => {
    setFormData(prev => ({ ...prev, ownerId }));
  };

  // Date change handler with time support
  const handleDateChange = (fieldName: string, date: Date | undefined) => {
    if (!date) {
      console.log(`Clearing date field: ${fieldName}`);
      setFormData(prev => ({
        ...prev,
        [fieldName]: null
      }));
      return;
    }
    
    try {
      // Store the full date with time as ISO string
      const isoString = date.toISOString();
      console.log(`Setting ${fieldName} to: ${isoString} from date object:`, date);
      
      // Only update the specific field that was changed
      const updates: Partial<Record<string, string>> = {
        [fieldName]: isoString
      };
      
      // If changing signupDate and the lead is closed, also update closedAt to match
      if (fieldName === 'signupDate' && formData.status === 'Closed') {
        updates.closedAt = isoString;
      }
      // If changing closedAt and the lead is closed, also update signupDate to match
      else if (fieldName === 'closedAt' && formData.status === 'Closed') {
        updates.signupDate = isoString;
      }
      
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
    } catch (error) {
      console.error(`Error formatting date for ${fieldName}:`, error);
      toast({
        title: "Date Error",
        description: "There was an error processing the date. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lead && formData) {
      // Log what we're about to save for debugging
      console.log('Saving lead with dates:', {
        demoDate: formData.demoDate,
        signupDate: formData.signupDate,
        nextFollowUp: formData.nextFollowUp,
        closedAt: formData.closedAt
      });
      
      // Create a new object to ensure we don't have reference issues
      const updatedLead = { ...lead, ...JSON.parse(JSON.stringify(formData)) };
      onSave(updatedLead);
      onClose();
      
      // Show success message
      toast({
        title: "Lead updated successfully",
        description: `Updated ${updatedLead.contactName}'s information`,
      });
    }
  };

  // Delete lead handler
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

  // Format a date for display with time
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Select a date and time';
    
    try {
      const dateObj = parseDate(dateString);
      if (!dateObj) return 'Select a date and time';
      
      return format(dateObj, 'PPP p'); // Localized date and time format
    } catch (error) {
      console.error("Error formatting date for display:", dateString, error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            {/* Demo Date */}
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
                    {formatDateForDisplay(formData.demoDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <CalendarComponent
                      mode="single"
                      selected={parseDate(formData.demoDate)}
                      onSelect={(date) => {
                        if (date) {
                          // Preserve time if there was a previous date selection
                          const prevDate = parseDate(formData.demoDate);
                          if (prevDate) {
                            date.setHours(prevDate.getHours(), prevDate.getMinutes());
                          } else {
                            // Default to current time
                            const now = new Date();
                            date.setHours(now.getHours(), now.getMinutes());
                          }
                          handleDateChange('demoDate', date);
                        } else {
                          handleDateChange('demoDate', undefined);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {parseDate(formData.demoDate) && (
                      <div className="mt-3 border-t pt-3">
                        <Input
                          type="time"
                          onChange={(e) => {
                            const timeValue = e.target.value;
                            const [hours, minutes] = timeValue.split(':').map(Number);
                            const date = parseDate(formData.demoDate);
                            if (date) {
                              date.setHours(hours, minutes);
                              handleDateChange('demoDate', date);
                            }
                          }}
                          value={parseDate(formData.demoDate) ? 
                            format(parseDate(formData.demoDate) || new Date(), 'HH:mm') : 
                            ''
                          }
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Signup Date */}
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
                    {formatDateForDisplay(formData.signupDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <CalendarComponent
                      mode="single"
                      selected={parseDate(formData.signupDate)}
                      onSelect={(date) => {
                        if (date) {
                          // Preserve time if there was a previous date selection
                          const prevDate = parseDate(formData.signupDate);
                          if (prevDate) {
                            date.setHours(prevDate.getHours(), prevDate.getMinutes());
                          } else {
                            // Default to current time
                            const now = new Date();
                            date.setHours(now.getHours(), now.getMinutes());
                          }
                          handleDateChange('signupDate', date);
                        } else {
                          handleDateChange('signupDate', undefined);
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                    {parseDate(formData.signupDate) && (
                      <div className="mt-3 border-t pt-3">
                        <Input
                          type="time"
                          onChange={(e) => {
                            const timeValue = e.target.value;
                            const [hours, minutes] = timeValue.split(':').map(Number);
                            const date = parseDate(formData.signupDate);
                            if (date) {
                              date.setHours(hours, minutes);
                              handleDateChange('signupDate', date);
                            }
                          }}
                          value={parseDate(formData.signupDate) ? 
                            format(parseDate(formData.signupDate) || new Date(), 'HH:mm') : 
                            ''
                          }
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Next Follow-Up */}
          <div>
            <label className="block text-sm font-medium mb-1">Next Follow-Up</label>
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
                  {formatDateForDisplay(formData.nextFollowUp)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <CalendarComponent
                    mode="single"
                    selected={parseDate(formData.nextFollowUp)}
                    onSelect={(date) => {
                      if (date) {
                        // Preserve time if there was a previous date selection
                        const prevDate = parseDate(formData.nextFollowUp);
                        if (prevDate) {
                          date.setHours(prevDate.getHours(), prevDate.getMinutes());
                        } else {
                          // Default to current time
                          const now = new Date();
                          date.setHours(now.getHours(), now.getMinutes());
                        }
                        handleDateChange('nextFollowUp', date);
                      } else {
                        handleDateChange('nextFollowUp', undefined);
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                  {parseDate(formData.nextFollowUp) && (
                    <div className="mt-3 border-t pt-3">
                      <Input
                        type="time"
                        onChange={(e) => {
                          const timeValue = e.target.value;
                          const [hours, minutes] = timeValue.split(':').map(Number);
                          const date = parseDate(formData.nextFollowUp);
                          if (date) {
                            date.setHours(hours, minutes);
                            handleDateChange('nextFollowUp', date);
                          }
                        }}
                        value={parseDate(formData.nextFollowUp) ? 
                          format(parseDate(formData.nextFollowUp) || new Date(), 'HH:mm') : 
                          ''
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
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
