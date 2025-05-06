
import React from 'react';
import { User, CommissionRule } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Trash2, Plus, Minus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserEditFormProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  
  // Initialize with existing commission rules or create a default one
  const initialRules = user.commissionRules && user.commissionRules.length > 0 
    ? user.commissionRules.sort((a, b) => a.threshold - b.threshold)
    : [{ threshold: 0, amount: 100 }];
    
  const form = useForm({
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      commissionRules: initialRules,
      closedDeals: user.closedDeals || 0,
      totalCommission: user.totalCommission || 0
    }
  });

  const commissionRules = form.watch('commissionRules') || [];
  
  const handleSubmit = (data: User) => {
    // Ensure commission rules are sorted by threshold
    data.commissionRules = data.commissionRules?.sort((a, b) => a.threshold - b.threshold);
    onSave(data);
  };

  const addCommissionRule = () => {
    const currentRules = form.getValues('commissionRules') || [];
    // Determine a reasonable next threshold based on existing rules
    const nextThreshold = currentRules.length > 0 
      ? Math.max(...currentRules.map(r => r.threshold)) + 10 
      : 10;
    
    form.setValue('commissionRules', [
      ...currentRules, 
      { threshold: nextThreshold, amount: 150 }
    ]);
  };

  const removeCommissionRule = (index: number) => {
    const currentRules = form.getValues('commissionRules') || [];
    // Don't remove the last rule
    if (currentRules.length <= 1) {
      toast({
        title: "Cannot remove rule",
        description: "You must have at least one commission rule.",
        variant: "destructive"
      });
      return;
    }
    
    const newRules = currentRules.filter((_, i) => i !== index);
    form.setValue('commissionRules', newRules);
  };

  const handleDelete = () => {
    onDelete(user.id);
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit User: {user.name}</SheetTitle>
          </SheetHeader>
          
          <div className="py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base">Commission Rules</FormLabel>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addCommissionRule}
                    >
                      <Plus size={16} className="mr-1" /> Add Rule
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {commissionRules.map((rule, index) => (
                      <div 
                        key={index} 
                        className="flex items-end gap-4 p-3 bg-muted/50 rounded-md"
                      >
                        <FormField
                          control={form.control}
                          name={`commissionRules.${index}.threshold`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>
                                {index === 0 ? 'Base Rate (Threshold: 0)' : 'After # Closes'}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  disabled={index === 0} // Base rate always has threshold 0
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`commissionRules.${index}.amount`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Amount ($) per Close</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="mb-0.5"
                          onClick={() => removeCommissionRule(index)}
                          disabled={index === 0} // Cannot remove base rate
                        >
                          <Minus size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={user.id === currentUser.id} // Cannot remove admin from yourself
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Admin privileges</FormLabel>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={user.id === currentUser.id} // Cannot delete yourself
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete User
                  </Button>
                  <Button type="submit" className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {user.name}'s account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserEditForm;
