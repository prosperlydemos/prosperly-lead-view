
import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/types';

interface SalesRepFilterProps {
  users: User[];
  selectedUserId: string | 'all';
  onUserChange: (userId: string | 'all') => void;
}

const SalesRepFilter: React.FC<SalesRepFilterProps> = ({
  users,
  selectedUserId,
  onUserChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Sales Rep:</span>
      <Select
        value={selectedUserId}
        onValueChange={onUserChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select sales rep" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sales Reps</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SalesRepFilter;
