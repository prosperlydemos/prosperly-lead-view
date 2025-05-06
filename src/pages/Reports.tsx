
import React, { useState, useEffect } from 'react';
import { User, Lead } from '../types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseLeadToAppLead } from '../types/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/UserManagement';
import { useReportsData } from '@/hooks/useReportsData';
import MetricsCards from '@/components/reports/MetricsCards';
import OverviewTab from '@/components/reports/OverviewTab';
import LeaderboardTab from '@/components/reports/LeaderboardTab';
import CommissionsTab from '@/components/reports/CommissionsTab';

// Colors for charts - kept here for reference
const COLORS = ['#9b87f5', '#8E9196', '#F97316', '#0EA5E9'];

interface ReportsProps {
  users: User[];
  leads: Lead[];
  currentUser: User;
}

const Reports: React.FC<ReportsProps> = ({ users: initialUsers, leads: initialLeads, currentUser: initialCurrentUser }) => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch leads and users data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*');
          
        if (leadsError) throw leadsError;
        
        // Fetch user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) throw profilesError;
        
        // Transform Supabase leads to our app's Lead format
        const transformedLeads = leadsData ? leadsData.map(mapSupabaseLeadToAppLead) : [];
        setLeads(transformedLeads);
        
        // Transform profiles to User format
        const transformedUsers = profilesData ? profilesData.map((profile): User => {
          // Parse commission rules from JSON
          let commissionRules = [];
          if (profile.commission_rules && Array.isArray(profile.commission_rules)) {
            commissionRules = profile.commission_rules.map((rule: any) => ({
              threshold: typeof rule.threshold === 'number' ? rule.threshold : 0,
              amount: typeof rule.amount === 'number' ? rule.amount : 0
            }));
          }
          
          return {
            id: profile.id,
            name: profile.name || 'Unknown',
            email: profile.email || '',
            isAdmin: profile.is_admin,
            commissionRules: commissionRules,
            totalCommission: profile.total_commission || 0,
            closedDeals: profile.closed_deals || 0
          };
        }) : [];
        setUsers(transformedUsers);
        
        // Find current user
        const currentUserData = profilesData?.find(p => p.id === profile.id);
        if (currentUserData) {
          // Parse commission rules for current user
          let userCommissionRules = [];
          if (currentUserData.commission_rules && Array.isArray(currentUserData.commission_rules)) {
            userCommissionRules = currentUserData.commission_rules.map((rule: any) => ({
              threshold: typeof rule.threshold === 'number' ? rule.threshold : 0,
              amount: typeof rule.amount === 'number' ? rule.amount : 0
            }));
          }
          
          setCurrentUser({
            id: currentUserData.id,
            name: currentUserData.name || 'Unknown',
            email: currentUserData.email || '',
            isAdmin: currentUserData.is_admin,
            commissionRules: userCommissionRules,
            totalCommission: currentUserData.total_commission || 0,
            closedDeals: currentUserData.closed_deals || 0
          });
        }
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [profile]);

  // Handle adding, editing, or deleting a user
  const handleAddUser = async (user: Omit<User, 'id'>) => {
    try {
      // Generate a UUID for the new user (in a real app, this would be handled by auth)
      const newUser = { ...user, id: crypto.randomUUID() };
      setUsers(prev => [...prev, newUser as User]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // Convert commissionRules to the format expected by Supabase
      const commissionRulesJson = updatedUser.commissionRules?.map(rule => ({
        threshold: rule.threshold,
        amount: rule.amount
      }));
      
      // Update the user in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          email: updatedUser.email,
          is_admin: updatedUser.isAdmin,
          commission_rules: commissionRulesJson
        })
        .eq('id', updatedUser.id);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
      
      // Update current user if that's the one being edited
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // In a real app with auth, you would delete the user from auth system
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Use the custom hook to get processed data
  const { filteredLeads, metrics, chartData } = useReportsData(leads, users, timeFilter);

  if (loading) {
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
            <h1 className="text-2xl font-bold">Sales Reports</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {currentUser?.isAdmin && (
          <div className="mb-6">
            <UserManagement 
              users={users} 
              onAddUser={handleAddUser} 
              onUpdateUser={handleUpdateUser} 
              onDeleteUser={handleDeleteUser} 
              currentUser={currentUser}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Sales Analytics</h2>
          <div className="flex gap-2">
            <Button 
              variant={timeFilter === 'week' ? 'default' : 'outline'} 
              onClick={() => setTimeFilter('week')}
              size="sm"
            >
              Week
            </Button>
            <Button 
              variant={timeFilter === 'month' ? 'default' : 'outline'} 
              onClick={() => setTimeFilter('month')}
              size="sm"
            >
              Month
            </Button>
            <Button 
              variant={timeFilter === 'quarter' ? 'default' : 'outline'} 
              onClick={() => setTimeFilter('quarter')}
              size="sm"
            >
              Quarter
            </Button>
            <Button 
              variant={timeFilter === 'year' ? 'default' : 'outline'} 
              onClick={() => setTimeFilter('year')}
              size="sm"
            >
              Year
            </Button>
          </div>
        </div>

        {/* Key metrics */}
        <MetricsCards {...metrics} />

        {/* Main tabs for different report types */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>
          
          {/* Tab contents */}
          <OverviewTab 
            leadSourcePieData={chartData.leadSourcePieData}
            statusPieData={chartData.statusPieData}
            monthlyTrendData={chartData.monthlyTrendData}
          />
          
          <LeaderboardTab 
            leaderboardData={chartData.leaderboardData}
          />
          
          <CommissionsTab 
            users={users}
            filteredLeads={filteredLeads}
            leaderboardData={chartData.leaderboardData}
          />
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;
