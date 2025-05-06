
import React, { useState, useEffect } from 'react';
import { User, Lead } from '../types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseLeadToAppLead } from '../types/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  CalendarDays,
  FileChart, 
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
import { format } from 'date-fns';

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
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  // Fetch leads data from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      if (!profile) return;
      
      setLoading(true);
      try {
        // Fetch leads
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*');
          
        if (leadsError) throw leadsError;
        
        // Transform Supabase leads to our app's Lead format
        const transformedLeads = leadsData ? leadsData.map(mapSupabaseLeadToAppLead) : [];
        setLeads(transformedLeads);
        setFilteredLeads(transformedLeads);
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
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

  // Prepare data for charts
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

    return {
      leadSourcePieData: Object.entries(leadSourceData).map(([name, value]) => ({ name, value })),
      statusPieData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      monthlyTrendData: monthlyData
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

        {/* Charts section */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
            <TabsTrigger value="status">Lead Status</TabsTrigger>
          </TabsList>
          
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
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="deals" fill="var(--color-deals)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sources">
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
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChartLegend
                      payload={chartData.leadSourcePieData.map((item, index) => ({
                        value: item.name,
                        color: COLORS[index % COLORS.length],
                      }))}
                    >
                      <ChartLegendContent />
                    </ChartLegend>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="status">
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
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ChartLegend
                      payload={chartData.statusPieData.map((item, index) => ({
                        value: item.name,
                        color: COLORS[index % COLORS.length],
                      }))}
                    >
                      <ChartLegendContent />
                    </ChartLegend>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Table of recent closed deals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Recent Closed Deals</CardTitle>
            <CardDescription>
              Showing the most recently closed deals in the selected time period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium">Contact Name</th>
                    <th className="py-3 text-left font-medium">Business</th>
                    <th className="py-3 text-left font-medium">Close Date</th>
                    <th className="py-3 text-right font-medium">Setup Fee</th>
                    <th className="py-3 text-right font-medium">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads
                    .filter(lead => lead.status === 'Closed')
                    .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
                    .slice(0, 5)
                    .map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">{lead.contactName}</td>
                        <td className="py-3">{lead.businessName}</td>
                        <td className="py-3">{lead.closedAt ? format(new Date(lead.closedAt), 'MMM d, yyyy') : 'N/A'}</td>
                        <td className="py-3 text-right">${lead.setupFee.toLocaleString()}</td>
                        <td className="py-3 text-right">${lead.mrr.toLocaleString()}</td>
                      </tr>
                    ))}
                  {filteredLeads.filter(lead => lead.status === 'Closed').length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">No closed deals in the selected time period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
