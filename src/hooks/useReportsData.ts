import { useState, useEffect } from 'react';
import { User, Lead, CommissionRule } from '@/types';
import { format, isWithinInterval, startOfMonth, endOfMonth, getMonth, getYear, startOfDay, endOfDay, parseISO, subMonths, isSameMonth, isSameYear } from 'date-fns';

interface Metrics {
  totalMRR: number;
  totalSetupFees: number;
  newLeadsCount: number;
  closedDealsCount: number;
  conversionRate: number;
  demosBooked: number;
  demoComparisonRate: number;
}

interface ChartData {
  leadSourcePieData: Array<{ name: string; value: number }>;
  statusPieData: Array<{ name: string; value: number }>;
  monthlyTrendData: Array<{ month: string; deals: number }>;
  revenueData: Array<{ month: string; mrr: number; setupFees: number; total: number }>;
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

interface DateFilter {
  startDate: Date;
  endDate: Date;
}

export const useReportsData = (
  leads: Lead[], 
  users: User[], 
  timeFilter: 'week' | 'month' | 'quarter' | 'year',
  dateFilter?: DateFilter,
  selectedUserId?: string
) => {
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalMRR: 0,
    totalSetupFees: 0,
    newLeadsCount: 0,
    closedDealsCount: 0,
    conversionRate: 0,
    demosBooked: 0,
    demoComparisonRate: 0
  });
  const [chartData, setChartData] = useState<ChartData>({
    leadSourcePieData: [],
    statusPieData: [],
    monthlyTrendData: [],
    revenueData: [],
    leaderboardData: []
  });

  // Filter leads based on date range and user ID - USE SIGNUP DATE for filtering closed deals
  useEffect(() => {
    if (!leads.length) return;

    let filtered: Lead[] = [...leads];

    // Filter by date range if provided - for closed deals, use signup date
    if (dateFilter) {
      const { startDate, endDate } = dateFilter;
      const startOfDayDate = startOfDay(startDate);
      const endOfDayDate = endOfDay(endDate);
      
      filtered = filtered.filter(lead => {
        // For closed deals, only consider signup date for the date filter
        if (lead.status === 'Closed') {
          const signupDate = lead.signupDate ? new Date(lead.signupDate) : null;
          return signupDate && isWithinInterval(signupDate, { start: startOfDayDate, end: endOfDayDate });
        }
        
        // For non-closed leads, check other relevant dates
        const demoDate = lead.demoDate ? new Date(lead.demoDate) : null;
        const signupDate = lead.signupDate ? new Date(lead.signupDate) : null;
        const closedDate = lead.closedAt ? new Date(lead.closedAt) : null;
        
        return (demoDate && isWithinInterval(demoDate, { start: startOfDayDate, end: endOfDayDate })) || 
               (signupDate && isWithinInterval(signupDate, { start: startOfDayDate, end: endOfDayDate })) ||
               (closedDate && isWithinInterval(closedDate, { start: startOfDayDate, end: endOfDayDate }));
      });
    }

    // Filter by user ID if provided
    if (selectedUserId) {
      filtered = filtered.filter(lead => lead.ownerId === selectedUserId);
    }

    setFilteredLeads(filtered);
    console.log('Filtered leads (using signup date for closed deals):', filtered);
  }, [leads, dateFilter, selectedUserId]);

  // Compute sales metrics
  useEffect(() => {
    if (!filteredLeads.length) {
      setMetrics({
        totalMRR: 0,
        totalSetupFees: 0,
        newLeadsCount: 0,
        closedDealsCount: 0,
        conversionRate: 0,
        demosBooked: 0,
        demoComparisonRate: 0
      });
      return;
    }
    
    // Log for debugging
    console.log('Computing metrics for leads:', filteredLeads);
    
    // Filter closed deals and log them
    const closedDeals = filteredLeads.filter(lead => lead.status === 'Closed');
    console.log('Closed deals:', closedDeals);
    
    // Total MRR from closed deals
    const totalMRR = closedDeals.reduce((sum, lead) => {
      console.log(`Adding MRR for ${lead.contactName}: ${lead.mrr}`);
      return sum + (lead.mrr || 0);
    }, 0);

    // Total setup fees from closed deals
    const totalSetupFees = closedDeals.reduce((sum, lead) => {
      console.log(`Adding setup fee for ${lead.contactName}: ${lead.setupFee}`);
      return sum + (lead.setupFee || 0);
    }, 0);

    // Count of leads excluding "Demo Scheduled" status for conversion rate calculation
    const leadsForConversionCalculation = filteredLeads.filter(lead => lead.status !== 'Demo Scheduled');
    
    // Count of closed deals
    const closedDealsCount = closedDeals.length;
    
    // Count of new leads (excluding "Demo Scheduled" for conversion calculation)
    const newLeadsCount = leadsForConversionCalculation.length;

    // Calculate demos booked in the current period
    let demosBooked = 0;
    let demoComparisonRate = 0;

    if (dateFilter) {
      // Get demos booked in the current period (using demo date)
      const demosInCurrentPeriod = leads.filter(lead => {
        if (!lead.demoDate) return false;
        const demoDate = new Date(lead.demoDate);
        return isWithinInterval(demoDate, { 
          start: dateFilter.startDate, 
          end: dateFilter.endDate 
        });
      });
      
      demosBooked = demosInCurrentPeriod.length;
      console.log(`Demos booked in current period: ${demosBooked}`);
      
      // Calculate the same period in the previous month
      const dayDifference = dateFilter.endDate.getDate() - dateFilter.startDate.getDate();
      const previousPeriodEnd = subMonths(dateFilter.endDate, 1);
      const previousPeriodStart = subMonths(dateFilter.startDate, 1);
      
      console.log(`Previous period: ${format(previousPeriodStart, 'MMM d')} - ${format(previousPeriodEnd, 'MMM d')}`);
      
      // Get demos booked in the previous period
      const demosInPreviousPeriod = leads.filter(lead => {
        if (!lead.demoDate) return false;
        const demoDate = new Date(lead.demoDate);
        return isWithinInterval(demoDate, { 
          start: previousPeriodStart, 
          end: previousPeriodEnd 
        });
      });
      
      const previousDemosCount = demosInPreviousPeriod.length;
      console.log(`Demos booked in previous period: ${previousDemosCount}`);
      
      // Calculate percentage change
      if (previousDemosCount > 0) {
        demoComparisonRate = ((demosBooked - previousDemosCount) / previousDemosCount) * 100;
      } else if (demosBooked > 0) {
        demoComparisonRate = 100; // If there were 0 demos before and some now, that's a 100% increase
      } else {
        demoComparisonRate = 0; // If both periods have 0 demos, then 0% change
      }
      
      console.log(`Demo comparison rate: ${demoComparisonRate.toFixed(1)}%`);
    }

    console.log('Calculated metrics:', {
      totalMRR,
      totalSetupFees,
      newLeadsCount,
      closedDealsCount,
      demosBooked,
      demoComparisonRate
    });

    setMetrics({
      totalMRR,
      totalSetupFees,
      newLeadsCount,
      closedDealsCount,
      conversionRate: newLeadsCount ? Math.round((closedDealsCount / newLeadsCount) * 100) : 0,
      demosBooked,
      demoComparisonRate: parseFloat(demoComparisonRate.toFixed(1))
    });
  }, [filteredLeads, leads, dateFilter]);

  // Prepare chart data
  useEffect(() => {
    if (!filteredLeads.length) return;
    
    console.log('Preparing chart data for leads:', filteredLeads);
    console.log('Users for commission calculation:', users);

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

    // Group by month for trend chart and revenue chart - USE SIGNUP DATE for commission reporting
    const currentDate = new Date();
    const monthlyData = Array(12).fill(0).map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 11 + i);
      
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Use signupDate instead of closedAt for commission reporting
      const monthlyClosedDeals = filteredLeads.filter(lead => {
        if (lead.signupDate && lead.status === 'Closed') {
          const signupDate = new Date(lead.signupDate);
          return signupDate >= monthStart && signupDate <= monthEnd;
        }
        return false;
      });
      
      // Log monthly deals for debugging
      const monthLabel = format(month, 'MMM yyyy');
      console.log(`Closed deals for ${monthLabel} (by signup date):`, monthlyClosedDeals.length, monthlyClosedDeals);
      
      const monthlyDealsCount = monthlyClosedDeals.length;
      
      // Calculate MRR and setup fees for the month
      let monthlyMRR = 0;
      let monthlySetupFees = 0;
      
      monthlyClosedDeals.forEach(lead => {
        monthlyMRR += (lead.mrr || 0);
        monthlySetupFees += (lead.setupFee || 0);
      });
      
      console.log(`Revenue data for ${monthLabel}: MRR=${monthlyMRR}, Setup=${monthlySetupFees}`);
      
      return {
        month: format(month, 'MMM'),
        monthYear: monthLabel, // Store full month and year for debugging
        deals: monthlyDealsCount,
        mrr: monthlyMRR,
        setupFees: monthlySetupFees,
        total: monthlyMRR + monthlySetupFees
      };
    });

    // Create leaderboard data with commission calculation - also use signup date
    const leaderboardData = users.map(user => {
      // Filter by signup date for commission calculations
      const userLeads = filteredLeads.filter(lead => 
        lead.ownerId === user.id && 
        lead.status === 'Closed' && 
        lead.signupDate // Only include leads with signup dates
      );
      
      console.log(`Processing user ${user.name} with ${userLeads.length} closed leads (by signup date):`, userLeads);
      
      const totalMRR = userLeads.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
      const totalSetupFees = userLeads.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
      const closedDeals = userLeads.length;
      
      // Calculate commission based on rules - fix malformed commission amounts
      let commission = 0;
      if (user.commissionRules && user.commissionRules.length) {
        console.log(`Applying commission rules for ${user.name}:`, user.commissionRules);
        
        // Make sure we have at least a base rule
        if (user.commissionRules.some(rule => rule.threshold === 0)) {
          // Find the base rule (threshold = 0)
          const baseRule = user.commissionRules.find(rule => rule.threshold === 0);
          if (baseRule) {
            commission = closedDeals * baseRule.amount;
            console.log(`Applied base rule: ${closedDeals} deals × $${baseRule.amount} = $${commission}`);
          }
        } else if (closedDeals > 0) {
          // If no base rule but we have deals, use a default commission
          commission = closedDeals * 249; // Default commission of $249 per deal
          console.log(`No base rule found, using default: ${closedDeals} deals × $249 = $${commission}`);
        }
      } else if (closedDeals > 0) {
        // If no commission rules at all but we have deals, use a default commission
        commission = closedDeals * 249; // Default commission of $249 per deal
        console.log(`No commission rules found, using default: ${closedDeals} deals × $249 = $${commission}`);
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
    
    console.log('Calculated leaderboard data:', leaderboardData);

    // Extract revenue data from monthlyData
    const revenueData = monthlyData.map(item => ({
      month: item.month,
      monthYear: item.monthYear, // Include full month/year for debugging
      mrr: item.mrr,
      setupFees: item.setupFees,
      total: item.total
    }));
    
    console.log('Revenue chart data:', revenueData);

    setChartData({
      leadSourcePieData: Object.entries(leadSourceData).map(([name, value]) => ({ name, value })),
      statusPieData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      monthlyTrendData: monthlyData.map(item => ({ month: item.month, deals: item.deals })),
      revenueData,
      leaderboardData
    });
  }, [filteredLeads, users]);

  return { filteredLeads, metrics, chartData };
};
