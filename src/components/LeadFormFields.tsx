
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRound } from 'lucide-react';
import DateInput from './DateInput';
import { Lead, LeadStatus, User } from '../types';

interface LeadFormFieldsProps {
  formData: Partial<Lead>;
  onChange: (field: string, value: any) => void;
  onStatusChange: (status: LeadStatus) => void;
  onOwnerChange: (ownerId: string) => void;
  onDateChange: (field: string, value: string | null) => void;
  users: User[];
  currentUser: User;
  canEditOwnership: boolean;
}

const LeadFormFields: React.FC<LeadFormFieldsProps> = ({
  formData,
  onChange,
  onStatusChange,
  onOwnerChange,
  onDateChange,
  users,
  currentUser,
  canEditOwnership
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      onChange(name, value === '' ? 0 : Number(value));
    } else {
      onChange(name, value);
    }
  };

  return (
    <div className="space-y-4">
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
          onValueChange={(value) => onStatusChange(value as LeadStatus)}
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
        <DateInput 
          label="Demo Date"
          value={formData.demoDate}
          onChange={(value) => onDateChange('demoDate', value)}
        />
        
        <DateInput 
          label="Signup Date"
          value={formData.signupDate}
          onChange={(value) => onDateChange('signupDate', value)}
        />
      </div>
      
      <DateInput 
        label="Next Follow-Up"
        value={formData.nextFollowUp}
        onChange={(value) => onDateChange('nextFollowUp', value)}
      />
      
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
            onValueChange={onOwnerChange}
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
    </div>
  );
};

export default LeadFormFields;
