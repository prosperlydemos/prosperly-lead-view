
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lead, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateCommission } from '@/utils/commissionUtils';

interface EditCommissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  owner: User;
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

  // Initialize with current commission amount
  useEffect(() => {
    if (isOpen && lead) {
      const currentCommission = lead.commissionAmount !== undefined && lead.commissionAmount !== null
        ? lead.commissionAmount
        : calculateCommission(lead, [owner]);
      setCommissionAmount(currentCommission.toString());
    }
  }, [isOpen, lead, owner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lead || !owner) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('leads')
        .update({
          commission_amount: parseFloat(commissionAmount)
        })
        .eq('id', lead.id);
        
      if (error) throw error;
      
      toast({
        title: "Commission updated",
        description: "The commission amount has been updated successfully."
      });
      
      onCommissionUpdated();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast({
        title: "Error updating commission",
        description: "Failed to update the commission amount",
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
