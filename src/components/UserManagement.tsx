
import React, { useState } from 'react';
import { User } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { UserPlus, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      isAdmin: false,
    }
  });

  const handleSubmit = (data: Omit<User, 'id'>) => {
    onAddUser(data);
    form.reset();
    setIsOpen(false);
    toast({
      title: "User added",
      description: `${data.name} has been added to your team.`
    });
  };

  // Only admin can access this component
  if (!currentUser.isAdmin) {
    return null;
  }

  return (
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
                </div>
                <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                  {user.isAdmin ? 'Admin' : 'User'}
                </Badge>
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
  );
};

export default UserManagement;
