
import React from 'react';
import { User } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFilterProps {
  users: User[];
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
  currentUser: User;
}

const UserFilter: React.FC<UserFilterProps> = ({ 
  users, 
  selectedUserId, 
  onUserChange, 
  currentUser 
}) => {
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
          {currentUser.isAdmin && (
            <SelectItem value="all">All Users</SelectItem>
          )}
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} {user.id === currentUser.id ? '(Me)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserFilter;
