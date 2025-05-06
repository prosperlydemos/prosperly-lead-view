
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import MonthlyDealsChart from '../charts/MonthlyDealsChart';
import PieChartCard from '../charts/PieChartCard';

// Colors for charts
const COLORS = ['#9b87f5', '#8E9196', '#F97316', '#0EA5E9'];

interface OverviewTabProps {
  leadSourcePieData: Array<{ name: string; value: number }>;
  statusPieData: Array<{ name: string; value: number }>;
  monthlyTrendData: Array<{ month: string; deals: number }>;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  leadSourcePieData, 
  statusPieData, 
  monthlyTrendData 
}) => {
  return (
    <TabsContent value="overview">
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
