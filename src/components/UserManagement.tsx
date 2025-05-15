
import React, { useState } from 'react';
import { User, CommissionRule } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { UserPlus, Users, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import UserEditForm from './UserEditForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser, 
  currentUser 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      isAdmin: false,
      commissionRules: [{
        threshold: 0,
        amount: 100
      }]
    }
  });

  const handleSubmit = (data: Omit<User, 'id'>) => {
    onAddUser(data);
    form.reset();
    toast({
      title: "User added",
      description: `${data.name} has been added to your team.`
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserEditOpen(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setIsUserEditOpen(false);
    toast({
      title: "User updated",
      description: `${updatedUser.name}'s information has been updated.`
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      toast({
        title: "Cannot delete your own account",
        description: "You cannot delete your own user account.",
        variant: "destructive"
      });
      return;
    }
    
    setDeleteConfirmUserId(userId);
  };

  const confirmDeleteUser = () => {
    if (deleteConfirmUserId) {
      onDeleteUser(deleteConfirmUserId);
      setDeleteConfirmUserId(null);
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted."
      });
    }
  };

  // Only admin can access this component
  if (!currentUser.isAdmin) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="mb-4">
            <Users size={16} className="mr-2" />
            Manage Users
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Team Management</SheetTitle>
          </SheetHeader>
          
          <div className="py-6">
            <h3 className="text-sm font-medium mb-2">Current Team ({users.length})</h3>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{user.name} {user.id === currentUser.id ? '(You)' : ''}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {user.commissionRules && user.commissionRules.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Base commission: ${user.commissionRules[0].amount}/close
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Add New Team Member</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commissionRules.0.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Commission Amount ($ per close)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
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
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Admin privileges</FormLabel>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  <UserPlus size={16} className="mr-2" />
                  Add Team Member
                </Button>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

      {editingUser && (
        <UserEditForm
          user={editingUser}
          isOpen={isUserEditOpen}
          onClose={() => setIsUserEditOpen(false)}
          onSave={handleUpdateUser}
          onDelete={handleDeleteUser}
          currentUser={currentUser}
        />
      )}

      <AlertDialog open={!!deleteConfirmUserId} onOpenChange={(isOpen) => !isOpen && setDeleteConfirmUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagement;
