
import React from 'react';
import { Lead, User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { calculateCommission, formatDate } from '@/utils/commissionUtils';

interface ClosedDealsTableProps {
  filteredLeads: Lead[];
  users: User[];
  onEditCommission: (lead: Lead) => void;
}

const ClosedDealsTable: React.FC<ClosedDealsTableProps> = ({
  filteredLeads,
  users,
  onEditCommission
}) => {
  // Filter only closed deals
  const closedDeals = filteredLeads.filter(lead => lead.status === 'Closed');
  
  // Sort by closing date (most recent first)
  const sortedDeals = [...closedDeals].sort((a, b) => {
    const dateA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
    const dateB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Closed Deals</CardTitle>
        <CardDescription>
          All closed deals in the selected time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Closed</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Setup Fee</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeals.length > 0 ? (
              sortedDeals.map((deal) => {
                const owner = users.find(user => user.id === deal.ownerId);
                const commissionAmount = deal.commissionAmount !== undefined && deal.commissionAmount !== null
                  ? deal.commissionAmount
                  : calculateCommission(deal, users);
                
                return (
                  <TableRow key={deal.id}>
                    <TableCell>{formatDate(deal.closedAt)}</TableCell>
                    <TableCell>{deal.businessName || deal.contactName}</TableCell>
                    <TableCell>{owner?.name || 'Unassigned'}</TableCell>
                    <TableCell>${deal.setupFee?.toLocaleString() || 0}</TableCell>
                    <TableCell>${deal.mrr?.toLocaleString() || 0}</TableCell>
                    <TableCell>${((deal.setupFee || 0) + (deal.mrr || 0)).toLocaleString()}</TableCell>
                    <TableCell>${commissionAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditCommission(deal)}
                      >
                        Edit Commission
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                  No closed deals in the selected time period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClosedDealsTable;
