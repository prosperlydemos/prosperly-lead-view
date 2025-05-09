
import React from 'react';
import { Link } from 'react-router-dom';
import { UserNavbar } from './UserNavbar';

const AppHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/">
            <img 
              src="/lovable-uploads/bddf0671-3318-4816-b18a-da414d5ecdb0.png" 
              alt="Prosperly Logo" 
              className="w-[250px]" 
            />
          </Link>
          <h1 className="text-xl font-bold ml-4">Prosperly Lead View</h1>
        </div>
        <UserNavbar />
      </div>
    </header>
  );
};

export default AppHeader;
