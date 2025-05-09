
import React from 'react';
import { Link } from 'react-router-dom';

const AppHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-2">
        <Link to="/">
          <img 
            src="/lovable-uploads/bddf0671-3318-4816-b18a-da414d5ecdb0.png" 
            alt="Prosperly Logo" 
            className="w-[250px]" 
          />
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
