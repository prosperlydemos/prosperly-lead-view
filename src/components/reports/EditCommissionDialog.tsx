
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lead, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditCommissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  owner: User | null;
  onCommissionUpdated: () => void;
}

const EditCommissionDialog: React.FC<EditCommissionDialogProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  owner,
  onCommissionUpdated 
}) => {
  const { toast } = useToast();
  const [commissionAmount, setCommissionAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens with new lead data
  useEffect(() => {
    if (isOpen && lead) {
      console.log('Setting commission amount from lead:', lead);
      // Try to get the commission from the lead's data or calculate it
      setCommissionAmount(lead.commissionAmount !== undefined && lead.commissionAmount !== null 
        ? lead.commissionAmount.toString() 
        : ''
      );
    }
  }, [isOpen, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead || !owner) return;
    
    try {
      setIsSubmitting(true);
      
      // Parse the commission amount
      const commission = parseFloat(commissionAmount);
      if (isNaN(commission)) {
        toast({
          title: "Invalid commission amount",
          description: "Please enter a valid number",
          variant: "destructive"
        });
        return;
      }
      
      // Update the lead with the commission amount in the database
      const { error: leadError } = await supabase
        .from('leads')
        .update({ commission_amount: commission })
        .eq('id', lead.id);
      
      if (leadError) throw leadError;
      
      // Update the user's total commission in the database
      const currentCommission = owner.totalCommission || 0;
      const previousCommission = lead.commissionAmount || 0;
      
      // Calculate the difference to add to the total (if updating an existing commission)
      const commissionDifference = commission - previousCommission;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          total_commission: currentCommission + commissionDifference
        })
        .eq('id', owner.id);
      
      if (profileError) throw profileError;
      
      toast({
        title: "Commission updated",
        description: `Commission of $${commission} has been saved for this deal.`
      });
      
      onCommissionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        title: "Error updating commission",
        description: "There was a problem updating the commission. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Commission</DialogTitle>
          <DialogDescription>
            Update the commission for this closed deal.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {lead && owner && (
            <div className="space-y-1 mb-4">
              <p><strong>Deal:</strong> {lead.businessName || lead.contactName}</p>
              <p><strong>Owner:</strong> {owner.name}</p>
              <p><strong>Setup Fee:</strong> ${(lead.setupFee || 0).toLocaleString()}</p>
              <p><strong>MRR:</strong> ${(lead.mrr || 0).toLocaleString()}</p>
              <p><strong>Total Value:</strong> ${((lead.setupFee || 0) + (lead.mrr || 0)).toLocaleString()}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="commission">Commission Amount ($)</Label>
            <Input
              id="commission"
              type="number"
              placeholder="Enter commission amount"
              value={commissionAmount}
              onChange={(e) => setCommissionAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Commission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommissionDialog;
