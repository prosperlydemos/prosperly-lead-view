
import React, { useState, useEffect } from 'react';
import { User, Lead, CommissionRule } from '../types';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, Medal, Award, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportsProps {
  users: User[];
  leads: Lead[];
  currentUser: User;
}

const DEFAULT_COMMISSION_RULES: CommissionRule[] = [
  { threshold: 0, amount: 100 }, // First 10 closes: $100 each
  { threshold: 10, amount: 150 } // After 10 closes: $150 each
];

const Reports: React.FC<ReportsProps> = ({ users, leads, currentUser }) => {
  const [monthFilter, setMonthFilter] = useState<string>(getCurrentMonthKey());
  const [userCommissionData, setUserCommissionData] = useState<User[]>([]);
  
  // Get current month in YYYY-MM format
  function getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get month name from YYYY-MM
  function getMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Get last 12 months in YYYY-MM format
  function getLast12Months(): { value: string, label: string }[] {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        value: monthKey,
        label: month.toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  }

  // Calculate commission based on rules
  function calculateCommission(closedCount: number, rules: CommissionRule[]): number {
    let totalCommission = 0;
    let remainingCloses = closedCount;
    
    // Sort rules by threshold in ascending order
    const sortedRules = [...rules].sort((a, b) => a.threshold - b.threshold);
    
    for (let i = 0; i < sortedRules.length; i++) {
      const rule = sortedRules[i];
      const nextThreshold = i < sortedRules.length - 1 ? sortedRules[i + 1].threshold : Infinity;
      const closesForThisRule = Math.min(remainingCloses, nextThreshold - rule.threshold);
      
      if (closesForThisRule > 0) {
        totalCommission += closesForThisRule * rule.amount;
        remainingCloses -= closesForThisRule;
      }
      
      if (remainingCloses <= 0) break;
    }
    
    return totalCommission;
  }

  // Prepare data each time users, leads or month filter changes
  useEffect(() => {
    const filteredLeads = leads.filter(lead => {
      // Only include closed leads
      if (lead.status !== 'Closed' || !lead.signupDate) return false;
      
      // Filter by selected month
      const closedDate = new Date(lead.signupDate);
      const closedMonthKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, '0')}`;
      return closedMonthKey === monthFilter;
    });

    // Count closed deals per user in the selected month
    const closesPerUser: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      closesPerUser[lead.ownerId] = (closesPerUser[lead.ownerId] || 0) + 1;
    });

    // Calculate commissions and update user data
    const updatedUsers = users.map(user => {
      const closedDeals = closesPerUser[user.id] || 0;
      const rules = user.commissionRules || DEFAULT_COMMISSION_RULES;
      const totalCommission = calculateCommission(closedDeals, rules);
      
      return {
        ...user,
        closedDeals,
        totalCommission
      };
    });

    // Sort by closed deals (descending)
    const sortedUsers = [...updatedUsers].sort((a, b) => (b.closedDeals || 0) - (a.closedDeals || 0));
    setUserCommissionData(sortedUsers);
  }, [users, leads, monthFilter]);

  // Format for chart visualization
  const chartData = userCommissionData.map(user => ({
    name: user.name,
    closedDeals: user.closedDeals || 0,
    commission: user.totalCommission || 0
  }));

  // Determine if user is admin
  const isAdmin = currentUser?.isAdmin;

  // Rank icons for top performers
  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-700" />;
      default: return null;
    }
  };

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
            <h1 className="text-2xl font-bold">Sales Leaderboard</h1>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Commission Report</h2>
          
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by month" />
            </SelectTrigger>
            <SelectContent>
              {getLast12Months().map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Deals Closed</CardTitle>
              <CardDescription>
                {getMonthName(monthFilter)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userCommissionData.reduce((sum, user) => sum + (user.closedDeals || 0), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total Commission</CardTitle>
              <CardDescription>
                {getMonthName(monthFilter)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${userCommissionData.reduce((sum, user) => sum + (user.totalCommission || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Performer</CardTitle>
              <CardDescription>
                {userCommissionData.length > 0 ? userCommissionData[0].name : 'No data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-yellow-500" /> 
                <span className="text-3xl font-bold">
                  {userCommissionData.length > 0 ? 
                    `${userCommissionData[0].closedDeals || 0} deals` : 
                    '0 deals'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Sales performance for {getMonthName(monthFilter)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Closed</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCommissionData.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium flex items-center">
                        {getRankIcon(index)} <span className="ml-1">{index + 1}</span>
                      </TableCell>
                      <TableCell>{user.name} {user.id === currentUser.id ? '(Me)' : ''}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={
                          (user.closedDeals || 0) > 10 ? 'bg-green-50' : 
                          (user.closedDeals || 0) > 5 ? 'bg-blue-50' : 'bg-gray-50'
                        }>
                          {user.closedDeals || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${(user.totalCommission || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  
                  {userCommissionData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                        No data available for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Performance Chart</CardTitle>
              <CardDescription>
                Closed deals and commission by team member
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ChartContainer className="h-80" config={{}}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="closedDeals" name="Closed Deals" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="commission" name="Commission ($)" fill="#82ca9d" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Commission Structure</CardTitle>
              <CardDescription>
                Current commission rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Closed Deals</TableHead>
                    <TableHead className="text-right">Commission per Deal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Base Rate</TableCell>
                    <TableCell>First 10 closes in a month</TableCell>
                    <TableCell className="text-right">$100</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bonus Rate</TableCell>
                    <TableCell>Each close after the first 10</TableCell>
                    <TableCell className="text-right">$150</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Reports;
