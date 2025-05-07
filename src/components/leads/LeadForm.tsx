
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Lead, LeadStatus, User } from '../../types';
import { UserRound } from 'lucide-react';
import { formatDateForInput } from '@/utils/dateUtils';

interface LeadFormProps {
  initialData?: Partial<Lead>;
  users: User[];
  currentUser: User;
  onSubmit: (data: Partial<Lead>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({
  initialData,
  users,
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  // Initialize state with callback function to properly merge initialData
  const [formData, setFormData] = useState<Partial<Lead>>(() => ({
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
    value: 0,
    ...initialData
  }));

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('Initial data provided:', initialData);
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    console.log(`Field ${name} changed to: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  // Handle date changes
  const handleDateChange = (field: string, value: string | null) => {
    console.log(`Date field ${field} changed to: ${value}`);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle status changes
  const handleStatusChange = (status: LeadStatus) => {
    console.log(`Status changed to: ${status}`);
    setFormData(prev => ({
      ...prev,
      status
    }));
  };

  // Handle owner changes
  const handleOwnerChange = (ownerId: string) => {
    console.log(`Owner changed to: ${ownerId}`);
    setFormData(prev => ({
      ...prev,
      ownerId
    }));
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data before submission:', formData);
    
    // Calculate value based on MRR if not set
    const calculatedValue = formData.value || (formData.mrr ? formData.mrr * 12 : 0);
    
    const submissionData = {
      ...formData,
      value: calculatedValue
    };
    console.log('Submitting form data:', submissionData);
    
    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="contactName">
          Contact Name
        </label>
        <Input
          id="contactName"
          name="contactName"
          value={formData.contactName || ''}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="businessName">
          Business Name
        </label>
        <Input
          id="businessName"
          name="businessName"
          value={formData.businessName || ''}
          onChange={handleInputChange}
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
          value={formData.crm || ''}
          onChange={handleInputChange}
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
          value={formData.leadSource || ''}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Lead Status</label>
        <Select
          value={formData.status || 'Demo Scheduled'}
          onValueChange={handleStatusChange}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="demoDate">
            Demo Date
          </label>
          <Input
            id="demoDate"
            name="demoDate"
            type="date"
            value={formData.demoDate ? formatDateForInput(formData.demoDate) : ''}
            onChange={(e) => handleDateChange('demoDate', e.target.value || null)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="signupDate">
            Signup Date
          </label>
          <Input
            id="signupDate"
            name="signupDate"
            type="date"
            value={formData.signupDate ? formatDateForInput(formData.signupDate) : ''}
            onChange={(e) => handleDateChange('signupDate', e.target.value || null)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="nextFollowUp">
          Next Follow-Up
        </label>
        <Input
          id="nextFollowUp"
          name="nextFollowUp"
          type="date"
          value={formData.nextFollowUp ? formatDateForInput(formData.nextFollowUp) : ''}
          onChange={(e) => handleDateChange('nextFollowUp', e.target.value || null)}
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
            value={formData.setupFee || 0}
            onChange={handleInputChange}
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
            value={formData.mrr || 0}
            onChange={handleInputChange}
          />
        </div>
      </div>

      {currentUser.isAdmin && (
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-2">
            <UserRound size={16} />
            Assigned To
          </label>
          <Select value={formData.ownerId || currentUser.id} onValueChange={handleOwnerChange}>
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

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Lead'}
        </Button>
      </div>
    </form>
  );
};

export default LeadForm;
