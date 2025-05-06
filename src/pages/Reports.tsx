
import React, { useState, useEffect } from 'react';
import { User, Lead } from '../types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseLeadToAppLead } from '../types/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// This is a temporary simplified version of Reports
// It will be updated with proper functionality later

interface ReportsProps {
  users: User[];
  leads: Lead[];
  currentUser: User;
}

const Reports: React.FC<ReportsProps> = ({ users: initialUsers, leads: initialLeads, currentUser: initialCurrentUser }) => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      try {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*');
          
        if (leadsError) throw leadsError;
        
        // Transform Supabase leads to our app's Lead format
        const transformedLeads = leadsData ? leadsData.map(mapSupabaseLeadToAppLead) : [];
        setLeads(transformedLeads);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center">
            <Link to="/" className="mr-4">
              <Button variant="outline" size="sm">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Reports</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <p className="text-lg">
          This page is under development. It will display sales reports and analytics.
        </p>
        <p className="mt-4">
          Total leads: {leads.length}
        </p>
      </main>
    </div>
  );
};

export default Reports;
