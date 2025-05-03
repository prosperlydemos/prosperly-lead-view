
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
import { User } from "./types";

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
  const [leads, setLeads] = useState(mockLeads);
  
  return (
    <Routes>
      <Route path="/" element={<Index 
        initialUsers={initialUsers} 
        initialCurrentUser={initialCurrentUser} 
      />} />
      <Route path="/reports" element={<Reports 
        users={users} 
        leads={leads} 
        currentUser={currentUser} 
      />} />
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
