
import { useState, useEffect } from 'react';
import { User, Lead, CommissionRule } from '@/types';
import { format } from 'date-fns';

interface Metrics {
  totalMRR: number;
  totalSetupFees: number;
  newLeadsCount: number;
  closedDealsCount: number;
  conversionRate: number;
}

interface ChartData {
  leadSourcePieData: Array<{ name: string; value: number }>;
  statusPieData: Array<{ name: string; value: number }>;
  monthlyTrendData: Array<{ month: string; deals: number }>;
  leaderboardData: Array<{
    id: string;
    name: string;
    email: string;
    closedDeals: number;
    totalValue: number;
    commission: number;
    commissionRules: CommissionRule[];
  }>;
}

export const useReportsData = (leads: Lead[], users: User[], timeFilter: 'week' | 'month' | 'quarter' | 'year') => {
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalMRR: 0,
    totalSetupFees: 0,
    newLeadsCount: 0,
    closedDealsCount: 0,
    conversionRate: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    leadSourcePieData: [],
    statusPieData: [],
    monthlyTrendData: [],
    leaderboardData: []
  });

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
  useEffect(() => {
    if (!filteredLeads.length) {
      setMetrics({
        totalMRR: 0,
        totalSetupFees: 0,
        newLeadsCount: 0,
        closedDealsCount: 0,
        conversionRate: 0
      });
      return;
    }
    
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

    setMetrics({
      totalMRR,
      totalSetupFees,
      newLeadsCount,
      closedDealsCount,
      conversionRate: newLeadsCount ? Math.round((closedDealsCount / newLeadsCount) * 100) : 0
    });
  }, [filteredLeads]);

  // Prepare chart data
  useEffect(() => {
    if (!filteredLeads.length) return;

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

    setChartData({
      leadSourcePieData: Object.entries(leadSourceData).map(([name, value]) => ({ name, value })),
      statusPieData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      monthlyTrendData: monthlyData,
      leaderboardData
    });
  }, [filteredLeads, users]);

  return { filteredLeads, metrics, chartData };
};
