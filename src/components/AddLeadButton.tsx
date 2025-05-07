
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, User } from '../types';
import { PlusCircle, UserRound, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddLeadButtonProps {
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
  users: User[];
  currentUser: User;
}

const AddLeadButton: React.FC<AddLeadButtonProps> = ({ onAddLead, users, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Lead, 'id'>>({
    contactName: '',
    email: '',
    businessName: '',
    leadSource: '',
    setupFee: 0,
    mrr: 0,
    demoDate: null,
    signupDate: null,
    status: 'Demo Scheduled', // Default status
    ownerId: currentUser.id, // Default to current user
    crm: '',
    nextFollowUp: null,
    value: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'setupFee' || name === 'mrr' ? Number(value) : value
    }));
  };

  const handleOwnerChange = (ownerId: string) => {
    setFormData(prev => ({
      ...prev,
      ownerId
    }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (!date) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: null 
      }));
      return;
    }

    try {
      // Store the full date object with time as an ISO string
      const isoDateString = date.toISOString();
      console.log(`Setting ${field} to: ${isoDateString}`);
      
      setFormData(prev => ({ 
        ...prev, 
        [field]: isoDateString
      }));
    } catch (error) {
      console.error(`Error formatting date for ${field}:`, error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead({
      ...formData,
      status: 'Demo Scheduled' // Ensure status is always Demo Scheduled
    });
    setFormData({
      contactName: '',
      email: '',
      businessName: '',
      leadSource: '',
      setupFee: 0,
      mrr: 0,
      demoDate: null,
      signupDate: null,
      status: 'Demo Scheduled',
      ownerId: currentUser.id,
      crm: '',
      nextFollowUp: null,
      value: 0
    });
    setIsOpen(false);
  };

  // Parse date string to Date object
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    
    try {
      // Parse ISO string to Date
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return undefined;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle size={16} className="mr-1" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="contactName">
              Contact Name*
            </label>
            <Input
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email*
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="businessName">
              Business Name*
            </label>
            <Input
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="crm">
              CRM System
            </label>
            <Input
              id="crm"
              name="crm"
              value={formData.crm}
              onChange={handleChange}
              placeholder="e.g. Salesforce, HubSpot, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="leadSource">
              Lead Source
            </label>
            <Input
              id="leadSource"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="demoDate">
                Demo Date
              </label>
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
                      format(parseDate(formData.demoDate) || new Date(), 'PPP p')
                    ) : (
                      <span>Select date and time</span>
                    )}
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

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="signupDate">
                Signup Date
              </label>
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
                      format(parseDate(formData.signupDate) || new Date(), 'PPP p')
                    ) : (
                      <span>Select date and time</span>
                    )}
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

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nextFollowUp">
              Next Follow-Up
            </label>
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
                    format(parseDate(formData.nextFollowUp) || new Date(), 'PPP p')
                  ) : (
                    <span>Schedule follow-up</span>
                  )}
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
              <label className="block text-sm font-medium mb-1" htmlFor="setupFee">
                Setup Fee ($)
              </label>
              <Input
                id="setupFee"
                name="setupFee"
                type="number"
                value={formData.setupFee}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mrr">
                MRR ($)
              </label>
              <Input
                id="mrr"
                name="mrr"
                type="number"
                value={formData.mrr}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {currentUser.isAdmin && (
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2" htmlFor="ownerId">
                <UserRound size={16} />
                Assigned To
              </label>
              <Select value={formData.ownerId} onValueChange={handleOwnerChange}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadButton;
