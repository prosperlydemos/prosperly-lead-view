
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserNavbar } from './UserNavbar';
import UserManagement from './UserManagement'; // Import UserManagement
import { useAuth } from '@/context/AuthContext';

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link to="/" onClick={handleLogoClick}>
          <img 
            src="/lovable-uploads/bddf0671-3318-4816-b18a-da414d5ecdb0.png" 
            alt="Prosperly Logo" 
            className="w-[250px]" 
          />
        </Link>
        <div className="flex items-center gap-4">
          {profile?.isAdmin && (
            <UserManagement 
              users={[]} 
              onAddUser={() => {}} 
              onUpdateUser={() => {}} 
              onDeleteUser={() => {}} 
              currentUser={{
                id: profile?.id || '',
                name: profile?.name || '',
                email: profile?.email || '',
                isAdmin: profile?.isAdmin || false,
                commissionRules: []
              }} 
            />
          )}
          <UserNavbar />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
