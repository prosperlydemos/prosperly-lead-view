
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MetricsCardsProps {
  totalMRR: number;
  totalSetupFees: number;
  closedDealsCount: number;
  newLeadsCount: number;
  conversionRate: number;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  totalMRR, 
  totalSetupFees, 
  closedDealsCount, 
  newLeadsCount, 
  conversionRate 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total MRR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalMRR.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Setup Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSetupFees.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">One-time payments</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Closed Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closedDealsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Out of {newLeadsCount} leads</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">Lead to customer</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
