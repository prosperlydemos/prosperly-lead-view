
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Lead } from '@/types';
import DemoDetailsModal from './DemoDetailsModal';

interface MetricsCardsProps {
  totalMRR: number;
  totalSetupFees: number;
  closedDealsCount: number;
  newLeadsCount: number;
  conversionRate: number;
  demosBooked: number;
  demoComparisonRate: number;
  leads?: Lead[]; // Add leads prop for demo details
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  totalMRR, 
  totalSetupFees, 
  closedDealsCount, 
  newLeadsCount, 
  conversionRate,
  demosBooked,
  demoComparisonRate,
  leads = []
}) => {
  const [isDemoDetailsOpen, setIsDemoDetailsOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
            <p className="text-xs text-muted-foreground mt-1">Lead to customer (excluding Demo Scheduled)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Demos Booked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold mr-2">{demosBooked}</div>
              {demoComparisonRate !== 0 && (
                <div className={`flex items-center text-sm ${demoComparisonRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {demoComparisonRate > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(demoComparisonRate)}%
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs. same period last month</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 h-7 text-xs"
              onClick={() => setIsDemoDetailsOpen(true)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <DemoDetailsModal 
        isOpen={isDemoDetailsOpen}
        onClose={() => setIsDemoDetailsOpen(false)}
        leads={leads}
      />
    </>
  );
};

export default MetricsCards;
