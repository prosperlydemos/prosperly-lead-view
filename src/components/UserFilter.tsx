
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface UserFilterProps {
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
  onUsersLoaded?: (users: Profile[]) => void; // New prop to expose loaded users
}

const UserFilter: React.FC<UserFilterProps> = ({ 
  selectedUserId, 
  onUserChange,
  onUsersLoaded
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const { profile: currentUser } = useAuth();
  
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      if (data) {
        setUsers(data);
        if (onUsersLoaded) {
          onUsersLoaded(data);
        }
      }
    };
    
    fetchUsers();
  }, [onUsersLoaded]);

  return (
    <div className="mb-4">
      <Select 
        value={selectedUserId} 
        onValueChange={onUserChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by owner" />
        </SelectTrigger>
        <SelectContent>
          {currentUser?.is_admin && (
            <SelectItem value="all">All Users</SelectItem>
          )}
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} {user.id === currentUser?.id ? '(Me)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserFilter;
