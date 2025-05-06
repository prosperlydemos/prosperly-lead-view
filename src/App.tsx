
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import { useState } from "react";
import { mockLeads } from "./data/mockData";
import { User, Lead } from "./types";

const queryClient = new QueryClient();

// We need to separate the router component to access React Router hooks
const AppRoutes = () => {
  // Create a mock admin user for the initial state
  const initialCurrentUser: User = {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    isAdmin: true,
    commissionRules: [
      { threshold: 0, amount: 100 }, // First 10 closes: $100 each
      { threshold: 10, amount: 150 } // After 10 closes: $150 each
    ]
  };
  
  // Initialize mock users with the admin user
  const initialUsers = [
    initialCurrentUser,
    {
      id: 'user-2',
      name: 'Sales Rep 1',
      email: 'sales1@example.com',
      isAdmin: false,
      commissionRules: [
        { threshold: 0, amount: 100 },
        { threshold: 10, amount: 150 }
      ]
    },
    {
      id: 'user-3',
      name: 'Sales Rep 2',
      email: 'sales2@example.com',
      isAdmin: false,
      commissionRules: [
        { threshold: 0, amount: 100 },
        { threshold: 10, amount: 150 }
      ]
    }
  ];
  
  // State for passing to both pages
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialCurrentUser);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  
  // Handler for adding a new user
  const handleAddUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${users.length + 1}`,
      commissionRules: [
        { threshold: 0, amount: 100 },
        { threshold: 10, amount: 150 }
      ]
    };
    
    setUsers(prev => [...prev, newUser]);
  };
  
  // Handler for updating a user
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    
    // If the current user was updated, update the current user state
    if (updatedUser.id === currentUser.id) {
      setCurrentUser(updatedUser);
    }
  };
  
  // Handler for deleting a user
  const handleDeleteUser = (userId: string) => {
    // Check if the user has any assigned leads
    const userHasLeads = leads.some(lead => lead.ownerId === userId);
    
    if (userHasLeads) {
      return;
    }
    
    setUsers(prev => prev.filter(user => user.id !== userId));
  };
  
  // Handler for adding a new lead
  const handleAddLead = (leadData: Omit<Lead, 'id'>) => {
    const newLead: Lead = {
      ...leadData,
      id: `${leads.length + 1}`
    };
    
    setLeads(prev => [...prev, newLead]);
  };
  
  // Handler for updating a lead
  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    ));
  };
  
  // Handler for deleting a lead
  const handleDeleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
  };
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Index 
            users={users}
            currentUser={currentUser}
            leads={leads}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
          />
        } 
      />
      <Route 
        path="/reports" 
        element={
          <Reports 
            users={users} 
            leads={leads} 
            currentUser={currentUser} 
          />
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
