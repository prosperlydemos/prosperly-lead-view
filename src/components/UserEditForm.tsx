
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, CommissionRule } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface UserEditFormProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  onDelete: (userId: string) => void;
  currentUser: User;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  currentUser
}) => {
  const [formData, setFormData] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        commissionRules: user.commissionRules ? [...user.commissionRules] : [
          { threshold: 0, amount: 100 },
          { threshold: 10, amount: 150 }
        ]
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!formData) return;
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCommissionRuleChange = (index: number, field: keyof CommissionRule, value: number) => {
    if (!formData || !formData.commissionRules) return;
    
    const updatedRules = [...formData.commissionRules];
    updatedRules[index][field] = value;
    
    setFormData({
      ...formData,
      commissionRules: updatedRules
    });
  };

  const addCommissionRule = () => {
    if (!formData || !formData.commissionRules) return;
    
    // Find the highest threshold and add a new rule with threshold + 5
    const highestThreshold = Math.max(...formData.commissionRules.map(rule => rule.threshold));
    const newRule: CommissionRule = {
      threshold: highestThreshold + 5,
      amount: formData.commissionRules[formData.commissionRules.length - 1].amount + 50
    };
    
    setFormData({
      ...formData,
      commissionRules: [...formData.commissionRules, newRule]
    });
  };

  const removeCommissionRule = (index: number) => {
    if (!formData || !formData.commissionRules || formData.commissionRules.length <= 1) return;
    
    const updatedRules = formData.commissionRules.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      commissionRules: updatedRules
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Check for valid email
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Validate commission rules
    if (formData.commissionRules) {
      // Sort rules by threshold
      const sortedRules = [...formData.commissionRules].sort((a, b) => a.threshold - b.threshold);
      
      // Check first rule has threshold 0
      if (sortedRules[0].threshold !== 0) {
        toast({
          title: "Invalid commission structure",
          description: "The first rule must have a threshold of 0",
          variant: "destructive"
        });
        return;
      }
      
      formData.commissionRules = sortedRules;
    }

    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (user) {
      if (user.id === currentUser.id) {
        toast({
          title: "Cannot delete your own account",
          description: "You cannot delete your own user account.",
          variant: "destructive"
        });
        setDeleteDialogOpen(false);
        return;
      }
      
      onDelete(user.id);
      setDeleteDialogOpen(false);
      onClose();
    }
  };

  if (!formData) return null;

  // Only allow admin to change admin status
  const canChangeAdminStatus = currentUser.isAdmin;
  
  // Can't edit own admin status
  const canToggleAdminStatus = canChangeAdminStatus && currentUser.id !== user?.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
            <Input 
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <Input 
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          {canChangeAdminStatus && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => {
                  if (canToggleAdminStatus) {
                    setFormData({
                      ...formData,
                      isAdmin: e.target.checked
                    });
                  }
                }}
                disabled={!canToggleAdminStatus}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Admin privileges
              </label>
              {!canToggleAdminStatus && user?.id === currentUser.id && (
                <span className="text-xs text-muted-foreground ml-2">(Cannot change your own admin status)</span>
              )}
            </div>
          )}
          
          <div className="pt-2">
            <h3 className="text-sm font-semibold mb-2">Commission Structure</h3>
            <div className="space-y-3 mb-2">
              {formData.commissionRules?.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">
                      {index === 0 ? 'Base threshold (must be 0)' : 'After # of deals'}
                    </label>
                    <Input 
                      type="number"
                      min={index === 0 ? 0 : 1}
                      value={rule.threshold}
                      onChange={(e) => handleCommissionRuleChange(index, 'threshold', parseInt(e.target.value) || 0)}
                      readOnly={index === 0}  // First rule threshold must be 0
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Commission amount ($)</label>
                    <Input 
                      type="number"
                      min={0}
                      value={rule.amount}
                      onChange={(e) => handleCommissionRuleChange(index, 'amount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeCommissionRule(index)}
                    disabled={index === 0 || formData.commissionRules?.length === 1}
                    className="self-end mb-0.5"
                  >
                    <MinusCircle size={18} />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCommissionRule}
              className="mt-2"
            >
              <PlusCircle size={16} className="mr-1" />
              Add Tier
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              Commission tiers are applied in order. For example, if a user has 15 closes in a month and the tiers are set at 0 and 10, 
              they would receive the first-tier amount for the first 10 closes and the second-tier amount for the remaining 5.
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center pt-4">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 size={16} className="mr-1" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {formData.name}'s user account. This action cannot be undone.
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

export default UserEditForm;
