import React, { useState, useEffect } from 'react';
import { User, Lead, CommissionRule } from '../types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseLeadToAppLead } from '../types/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  CalendarDays,
  BarChart2, 
  TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserManagement from '@/components/UserManagement';

// Colors for charts
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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [currentTab, setCurrentTab] = useState<'overview' | 'leaderboard' | 'commissions'>('overview');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
        setFilteredLeads(transformedLeads);
        
        // Transform profiles to User format
        const transformedUsers = profilesData ? profilesData.map((profile): User => {
          // Type safe conversion of commission rules
          let commissionRules: CommissionRule[] = [];
          if (profile.commission_rules && Array.isArray(profile.commission_rules)) {
            commissionRules = (profile.commission_rules as any[]).map(rule => ({
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
          // Type safe conversion of commission rules for current user
          let userCommissionRules: CommissionRule[] = [];
          if (currentUserData.commission_rules && Array.isArray(currentUserData.commission_rules)) {
            userCommissionRules = (currentUserData.commission_rules as any[]).map(rule => ({
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

  // Filter leads based on time range
  useEffect(() => {
    if (!leads.length) return;

    const now = new Date();
    let filterDate = new Date();

    switch (timeFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filtered = leads.filter(lead => {
      if (lead.closedAt) {
        const closedDate = new Date(lead.closedAt);
        return closedDate >= filterDate;
      }
      return false;
    });

    setFilteredLeads(filtered);
  }, [leads, timeFilter]);

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
      // For now, we'll just remove from local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Compute sales metrics
  const computeMetrics = () => {
    // Total MRR from closed deals
    const totalMRR = filteredLeads
      .filter(lead => lead.status === 'Closed' && lead.mrr)
      .reduce((sum, lead) => sum + lead.mrr, 0);

    // Total setup fees from closed deals
    const totalSetupFees = filteredLeads
      .filter(lead => lead.status === 'Closed' && lead.setupFee)
      .reduce((sum, lead) => sum + lead.setupFee, 0);

    // Count of new leads
    const newLeadsCount = filteredLeads.length;
    
    // Count of closed deals
    const closedDealsCount = filteredLeads.filter(lead => lead.status === 'Closed').length;

    return {
      totalMRR,
      totalSetupFees,
      newLeadsCount,
      closedDealsCount,
      conversionRate: newLeadsCount ? Math.round((closedDealsCount / newLeadsCount) * 100) : 0
    };
  };

  const metrics = computeMetrics();

  // Prepare data for charts and leaderboards
  const prepareChartData = () => {
    // Group by lead source
    const leadSourceData = filteredLeads.reduce((acc, lead) => {
      const source = lead.leadSource || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const statusData = filteredLeads.reduce((acc, lead) => {
      const status = lead.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by month for trend chart
    const monthlyData = Array(12).fill(0).map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 11 + i);
      
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthlyClosedDeals = filteredLeads.filter(lead => {
        if (lead.closedAt) {
          const closedDate = new Date(lead.closedAt);
          return closedDate >= monthStart && closedDate <= monthEnd && lead.status === 'Closed';
        }
        return false;
      }).length;
      
      return {
        month: format(month, 'MMM'),
        deals: monthlyClosedDeals,
      };
    });

    // Create leaderboard data
    const leaderboardData = users.map(user => {
      const userLeads = filteredLeads.filter(lead => lead.ownerId === user.id && lead.status === 'Closed');
      const totalMRR = userLeads.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
      const totalSetupFees = userLeads.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
      const closedDeals = userLeads.length;
      
      // Calculate commission based on rules
      let commission = 0;
      if (user.commissionRules && user.commissionRules.length) {
        // Sort rules by threshold (highest first)
        const sortedRules = [...user.commissionRules].sort((a, b) => b.threshold - a.threshold);
        
        // Apply rules
        let remainingDeals = closedDeals;
        for (const rule of sortedRules) {
          if (remainingDeals > rule.threshold) {
            const dealsAtThisLevel = remainingDeals - rule.threshold;
            commission += dealsAtThisLevel * rule.amount;
            remainingDeals = rule.threshold;
          }
        }
        
        // Apply base rule (if any) to remaining deals
        const baseRule = sortedRules[sortedRules.length - 1];
        if (baseRule && baseRule.threshold === 0) {
          commission += remainingDeals * baseRule.amount;
        }
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        closedDeals,
        totalValue: totalMRR + totalSetupFees,
        commission,
        commissionRules: user.commissionRules || []
      };
    }).sort((a, b) => b.closedDeals - a.closedDeals);

    return {
      leadSourcePieData: Object.entries(leadSourceData).map(([name, value]) => ({ name, value })),
      statusPieData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      monthlyTrendData: monthlyData,
      leaderboardData
    };
  };

  const chartData = prepareChartData();

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalMRR.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Setup Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalSetupFees.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">One-time payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closed Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.closedDealsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of {metrics.newLeadsCount} leads</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Lead to customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Main tabs for different report types */}
        <Tabs defaultValue="overview" className="mb-8" onValueChange={(value) => setCurrentTab(value as any)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Closed Deals</CardTitle>
                <CardDescription>
                  Number of deals closed per month over the last year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartContainer config={{
                    deals: { theme: { light: '#9b87f5', dark: '#9b87f5' } }
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="deals" fill="var(--color-deals)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Sources</CardTitle>
                  <CardDescription>
                    Breakdown of leads by acquisition source
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ChartContainer config={{
                      sources: { label: "Lead Sources" }
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.leadSourcePieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {chartData.leadSourcePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <CustomChartLegend data={chartData.leadSourcePieData} colors={COLORS} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Status</CardTitle>
                  <CardDescription>
                    Distribution of leads by current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ChartContainer config={{
                      status: { label: "Lead Status" }
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.statusPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                          >
                            {chartData.statusPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <CustomChartLegend data={chartData.statusPieData} colors={COLORS} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Leaderboard and Commissions Tabs */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sales Leaderboard</CardTitle>
                <CardDescription>
                  Performance ranking based on number of closed deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Closed Deals</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead className="text-right">Commission Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartData.leaderboardData.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.closedDeals}</TableCell>
                        <TableCell>${user.totalValue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${user.commission.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {chartData.leaderboardData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No data available for the selected time period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commission Structure</CardTitle>
                <CardDescription>
                  Current commission rules for each team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Commission Rules</TableHead>
                      <TableHead>Total Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const userData = chartData.leaderboardData.find(u => u.id === user.id);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.commissionRules && user.commissionRules.length > 0 ? (
                              <ul className="text-sm space-y-1">
                                {user.commissionRules
                                  .sort((a, b) => a.threshold - b.threshold)
                                  .map((rule, idx) => (
                                    <li key={idx}>
                                      {rule.threshold === 0 
                                        ? `Base: $${rule.amount} per close`
                                        : `After ${rule.threshold} closes: $${rule.amount} each`}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <span className="text-muted-foreground">No rules defined</span>
                            )}
                          </TableCell>
                          <TableCell>${userData?.commission.toLocaleString() || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                          No users available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Closed Deals</CardTitle>
                <CardDescription>
                  Showing the most recently closed deals in the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead className="text-right">Setup Fee</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads
                      .filter(lead => lead.status === 'Closed')
                      .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
                      .slice(0, 10)
                      .map((lead) => {
                        const owner = users.find(u => u.id === lead.ownerId);
                        return (
                          <TableRow key={lead.id} className="border-b hover:bg-muted/50">
                            <TableCell>{lead.contactName}</TableCell>
                            <TableCell>{lead.businessName}</TableCell>
                            <TableCell>{owner?.name || 'Unknown'}</TableCell>
                            <TableCell>{lead.closedAt ? format(new Date(lead.closedAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="text-right">${lead.setupFee.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${lead.mrr.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                    {filteredLeads.filter(lead => lead.status === 'Closed').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">No closed deals in the selected time period.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Custom chart tooltip component to fix TypeScript errors
const CustomTooltip = (props: any) => {
  if (!props.active || !props.payload || !props.payload.length) {
    return null;
  }

  return (
    <div className="bg-background border p-2 rounded-md shadow-md">
      {props.payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ background: entry.color }}
          />
          <span>{entry.name || ''}: {entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Custom chart legend component to fix TypeScript errors
const CustomChartLegend = ({ 
  data, 
  colors 
}: { 
  data: Array<{ name: string; value: number }>; 
  colors: string[] 
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {data.map((item, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: colors[index % colors.length] }} 
          />
          <span className="text-sm">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default Reports;
