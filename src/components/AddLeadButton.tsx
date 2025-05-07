
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lead, User } from '../types';
import { PlusCircle, UserRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // New date change handler with improved date handling
  const handleDateChange = (field: string, value: string) => {
    try {
      console.log(`Setting ${field} with input value:`, value);
      
      let dateValue = null;
      
      if (value && value.trim() !== '') {
        // Parse the datetime-local input value and convert to ISO string
        dateValue = new Date(value).toISOString();
        console.log(`Converted ${field} to:`, dateValue);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [field]: dateValue
      }));
    } catch (error) {
      console.error(`Error processing date for ${field}:`, error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log what we're about to save
    console.log('Adding lead with dates:', {
      demoDate: formData.demoDate,
      signupDate: formData.signupDate,
      nextFollowUp: formData.nextFollowUp
    });
    
    onAddLead({
      ...formData,
      status: 'Demo Scheduled' // Ensure status is always Demo Scheduled for new leads
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

  // Helper function to format date for datetime-local input
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // Format as YYYY-MM-DDThh:mm (format required by datetime-local)
      return date.toISOString().slice(0, 16);
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
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
              <Input
                type="datetime-local"
                value={formatDateForInput(formData.demoDate)}
                onChange={(e) => handleDateChange('demoDate', e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="signupDate">
                Signup Date
              </label>
              <Input
                type="datetime-local"
                value={formatDateForInput(formData.signupDate)}
                onChange={(e) => handleDateChange('signupDate', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="nextFollowUp">
              Next Follow-Up
            </label>
            <Input
              type="datetime-local"
              value={formatDateForInput(formData.nextFollowUp)}
              onChange={(e) => handleDateChange('nextFollowUp', e.target.value)}
              className="w-full"
            />
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
