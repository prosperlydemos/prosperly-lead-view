
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { safeFormat } from './utils/commissionUtils';

interface RevenueSummaryCardProps {
  totalSetupFees: number;
  totalMRR: number;
  totalCommissions: number;
}

const RevenueSummaryCard: React.FC<RevenueSummaryCardProps> = ({
  totalSetupFees,
  totalMRR,
  totalCommissions
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Revenue Summary</CardTitle>
        <CardDescription>
          Overview of revenue and commissions for the selected time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Total Setup Fees</div>
            <div className="text-2xl font-bold">{safeFormat(totalSetupFees)}</div>
          </div>
          <div className="p-4 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Total MRR</div>
            <div className="text-2xl font-bold">{safeFormat(totalMRR)}</div>
          </div>
          <div className="p-4 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground mb-1">Total Commissions Paid</div>
            <div className="text-2xl font-bold">{safeFormat(totalCommissions)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueSummaryCard;
