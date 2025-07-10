
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import MonthlyDealsChart from '../charts/MonthlyDealsChart';
import PieChartCard from '../charts/PieChartCard';
import RevenueChart from '../charts/RevenueChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, isWithinInterval } from 'date-fns';
import { Lead } from '@/types';

// Colors for charts
const COLORS = ['#9b87f5', '#8E9196', '#F97316', '#0EA5E9'];

interface OverviewTabProps {
  leadSourcePieData: Array<{ name: string; value: number }>;
  statusPieData: Array<{ name: string; value: number }>;
  monthlyTrendData: Array<{ month: string; deals: number }>;
  revenueData: Array<{ month: string; mrr: number; setupFees: number; total: number }>;
  totalMRR: number;
  totalSetupFees: number;
  filteredLeads: Lead[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  leadSourcePieData, 
  statusPieData, 
  monthlyTrendData,
  revenueData,
  totalMRR,
  totalSetupFees,
  filteredLeads
}) => {
  // Calculate potential revenue from Hot Leads in the last 60 days
  const last60Days = subDays(new Date(), 60);
  const hotLeadsLast60Days = filteredLeads.filter(lead => {
    if (lead.status !== 'Hot Lead') return false;
    
    // Check if the lead was created in the last 60 days
    const createdAt = new Date(lead.signupDate || lead.demoDate || Date.now());
    return isWithinInterval(createdAt, { start: last60Days, end: new Date() });
  });

  const potentialMRRFromHotLeads = hotLeadsLast60Days.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
  const potentialSetupFeesFromHotLeads = hotLeadsLast60Days.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);

  return (
    <TabsContent value="overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Recurring Revenue (MRR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalMRR.toLocaleString()}</div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-muted-foreground">Potential from Hot Leads:</div>
              <div className="text-lg font-semibold text-orange-600">${potentialMRRFromHotLeads.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Setup Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSetupFees.toLocaleString()}</div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm text-muted-foreground">Potential from Hot Leads:</div>
              <div className="text-lg font-semibold text-orange-600">${potentialSetupFeesFromHotLeads.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RevenueChart data={revenueData} />
      
      <MonthlyDealsChart data={monthlyTrendData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <PieChartCard
          title="Lead Sources"
          description="Breakdown of leads by acquisition source"
          data={leadSourcePieData}
          colors={COLORS}
        />

        <PieChartCard
          title="Lead Status"
          description="Distribution of leads by current status"
          data={statusPieData}
          colors={COLORS}
        />
      </div>
    </TabsContent>
  );
};

export default OverviewTab;
