
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from './ChartComponents';

interface RevenueChartProps {
  data: Array<{ month: string; mrr: number; setupFees: number; total: number }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // Log the data being received by the chart for debugging
  console.log('RevenueChart data:', data);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
        <CardDescription>Monthly breakdown of MRR and setup fees</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="mrr" name="Monthly Recurring" fill="#9b87f5" />
              <Bar dataKey="setupFees" name="Setup Fees" fill="#0EA5E9" />
              <Bar dataKey="total" name="Total Revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
