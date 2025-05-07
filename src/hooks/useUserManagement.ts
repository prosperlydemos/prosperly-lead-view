
import { useState } from 'react';
import { Profile } from '../types/supabase';
import { User } from '../types/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

export const useUserManagement = (initialUsers: Profile[] = []) => {
  const [users, setUsers] = useState<Profile[]>(initialUsers);

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      // Convert app user format to Supabase profile format
      const profileData = {
        id: crypto.randomUUID(), // Generate a UUID for the new user
        name: userData.name,
        email: userData.email,
        is_admin: userData.isAdmin,
        // Convert the commission rules to a JSON-compatible format
        commission_rules: userData.commissionRules ? JSON.parse(JSON.stringify(userData.commissionRules)) : null
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
        
      if (error) throw error;
      
      setUsers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error adding user",
        description: "Failed to add new user",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // Convert app user format to Supabase profile format
      const profileData = {
        name: updatedUser.name,
        email: updatedUser.email,
        is_admin: updatedUser.isAdmin,
        // Convert the commission rules to a JSON-compatible format
        commission_rules: updatedUser.commissionRules ? JSON.parse(JSON.stringify(updatedUser.commissionRules)) : null
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', updatedUser.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setUsers(prev => 
        prev.map(user => user.id === updatedUser.id ? data : user)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error updating user",
        description: "Failed to update user information",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      toast({
        title: "User deleted",
        description: "User has been permanently deleted."
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: "Failed to delete the user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleUsersLoaded = (loadedUsers: Profile[]) => {
    setUsers(loadedUsers);
  };

  return {
    users,
    setUsers,
    handleAddUser,
    handleUpdateUser,
    handleDeleteUser,
    handleUsersLoaded
  };
};
