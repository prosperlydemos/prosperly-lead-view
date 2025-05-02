
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Lead } from '../types';

interface AddLeadButtonProps {
  onAddLead: (lead: Omit<Lead, 'id'>) => void;
}

const AddLeadButton: React.FC<AddLeadButtonProps> = ({ onAddLead }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Lead>>({
    contactName: '',
    email: '',
    businessName: '',
    leadSource: '',
    setupFee: 0,
    mrr: 0,
    demoDate: null,
    signupDate: null,
    status: 'Demo Scheduled'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'setupFee' || name === 'mrr' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLead(formData as Omit<Lead, 'id'>);
    setIsOpen(false);
    setFormData({
      contactName: '',
      email: '',
      businessName: '',
      leadSource: '',
      setupFee: 0,
      mrr: 0,
      demoDate: null,
      signupDate: null,
      status: 'Demo Scheduled'
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="mb-4 w-full">
        <Plus size={16} className="mr-1" />
        Add Lead
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="contactName">Contact Name</label>
              <Input 
                id="contactName"
                name="contactName"
                value={formData.contactName || ''}
                onChange={handleChange}
                required
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
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="businessName">Business Name</label>
              <Input 
                id="businessName"
                name="businessName"
                value={formData.businessName || ''}
                onChange={handleChange}
                required
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="demoDate">Demo Date</label>
                <Input 
                  id="demoDate"
                  name="demoDate"
                  type="datetime-local"
                  value={formData.demoDate ? formData.demoDate.slice(0, 16) : ''}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="signupDate">Signup Date</label>
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">Add Lead</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddLeadButton;
