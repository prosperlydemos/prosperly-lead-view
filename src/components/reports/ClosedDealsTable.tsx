
import React from 'react';
import { format } from 'date-fns';
import { Lead, User } from '@/types';
import { Button } from '@/components/ui/button';
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
import { safeFormat, calculateCommission } from './utils/commissionUtils';

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
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Closed Deals</CardTitle>
        <CardDescription>
          Showing all closed deals in the selected time period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Name</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Close Date</TableHead>
              <TableHead className="text-right">Setup Fee</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads
              .filter(lead => lead.status === 'Closed')
              .sort((a, b) => {
                const dateA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
                const dateB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
                return dateB - dateA;
              })
              .map((lead) => {
                const owner = users.find(u => u.id === lead.ownerId);
                const commission = lead.commissionAmount !== undefined && lead.commissionAmount !== null
                  ? lead.commissionAmount
                  : calculateCommission(lead, users);
                const setupFee = lead.setupFee || 0;
                const mrr = lead.mrr || 0;
                const totalValue = setupFee + mrr;
                
                return (
                  <TableRow key={lead.id} className="border-b hover:bg-muted/50">
                    <TableCell>{lead.contactName}</TableCell>
                    <TableCell>{lead.businessName}</TableCell>
                    <TableCell>{owner?.name || 'Unknown'}</TableCell>
                    <TableCell>{lead.closedAt ? format(new Date(lead.closedAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    <TableCell className="text-right">{safeFormat(setupFee)}</TableCell>
                    <TableCell className="text-right">{safeFormat(mrr)}</TableCell>
                    <TableCell className="text-right">{safeFormat(commission)}</TableCell>
                    <TableCell className="text-right">{safeFormat(totalValue)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEditCommission(lead)}
                      >
                        Edit Commission
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filteredLeads.filter(lead => lead.status === 'Closed').length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-4 text-center text-muted-foreground">No closed deals in the selected time period.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClosedDealsTable;
