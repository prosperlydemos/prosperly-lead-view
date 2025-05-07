
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRound } from 'lucide-react';
import { Lead, LeadStatus, User } from '../types';
import { formatDateForInput } from '@/utils/dateUtils';

interface LeadFormProps {
  initialData: Partial<Lead>;
  users: User[];
  currentUser: User;
  onSubmit: (data: Partial<Lead>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({
  initialData,
  users,
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showDelete = false,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>(initialData);
  const canEditOwnership = currentUser.isAdmin;

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else if (type === 'date') {
      // Handle date inputs - store as ISO string or null
      setFormData(prev => ({
        ...prev,
        [name]: value ? value : null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStatusChange = (status: LeadStatus) => {
    const updates: Partial<Lead> = { ...formData, status };
    
    // If changing to Closed status, set closedAt to today
    if (status === 'Closed' && (!formData.closedAt || formData.status !== 'Closed')) {
      const today = new Date().toISOString().split('T')[0];
      updates.closedAt = today;
      updates.signupDate = today;
    }
    
    setFormData(updates);
  };

  const handleOwnerChange = (ownerId: string) => {
    setFormData(prev => ({
      ...prev,
      ownerId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate value if MRR is provided and value is not set
    const finalData = { 
      ...formData,
      value: formData.value || (formData.mrr ? formData.mrr * 12 : 0)
    };
    
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="contactName">
          Contact Name*
        </label>
        <Input
          id="contactName"
          name="contactName"
          value={formData.contactName || ''}
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
          value={formData.email || ''}
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
          value={formData.businessName || ''}
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
          value={formData.crm || ''}
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
          value={formData.leadSource || ''}
          onChange={handleChange}
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
          <SelectContent className="z-50">
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
            value={formData.demoDate || ''}
            onChange={handleChange}
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
            value={formData.signupDate || ''}
            onChange={handleChange}
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
          value={formData.nextFollowUp || ''}
          onChange={handleChange}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="setupFee">
            Setup Fee ($)
          </label>
          <Input
            id="setupFee"
            name="setupFee"
            type="number"
            value={formData.setupFee !== undefined ? formData.setupFee : 0}
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
            value={formData.mrr !== undefined ? formData.mrr : 0}
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
            value={formData.ownerId || currentUser.id} 
            onValueChange={handleOwnerChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} {user.id === currentUser.id ? '(You)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        {showDelete && onDelete && (
          <Button 
            type="button" 
            variant="destructive"
            onClick={onDelete}
          >
            Delete Contact
          </Button>
        )}
        
        <div className="flex gap-2 ml-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LeadForm;
