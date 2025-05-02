
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
    status: 'Demo Scheduled',
    ownerId: currentUser.id // Default to current user
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'setupFee' || name === 'mrr' ? Number(value) : value
    }));
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({
      ...prev,
      status: status as Lead['status']
    }));
  };

  const handleOwnerChange = (ownerId: string) => {
    setFormData(prev => ({
      ...prev,
      ownerId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead(formData);
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
      ownerId: currentUser.id
    });
    setIsOpen(false);
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
                id="demoDate"
                name="demoDate"
                type="datetime-local"
                value={formData.demoDate ? formData.demoDate.slice(0, 16) : ''}
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
                type="datetime-local"
                value={formData.signupDate ? formData.signupDate.slice(0, 16) : ''}
                onChange={handleChange}
              />
            </div>
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

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
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
