
import React from 'react';
import { User } from '@/types';
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
import { safeFormat } from './utils/commissionUtils';
import { Lead } from '@/types';

interface CommissionStructureTableProps {
  users: User[];
  leaderboardData: Array<{
    id: string;
    name: string;
    commission: number;
  }>;
  filteredLeads: Lead[];
}

const CommissionStructureTable: React.FC<CommissionStructureTableProps> = ({
  users,
  leaderboardData,
  filteredLeads
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commission Structure</CardTitle>
        <CardDescription>
          Current commission rules for each team member
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Commission Rules</TableHead>
              <TableHead>Closed Deals</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Total Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const userData = leaderboardData.find(u => u.id === user.id);
              const userClosedLeads = filteredLeads.filter(lead => 
                lead.ownerId === user.id && 
                lead.status === 'Closed'
              );
              
              // Calculate the total revenue for each user's closed leads
              const userTotalMRR = userClosedLeads.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
              const userTotalSetupFees = userClosedLeads.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
              const userTotalRevenue = userTotalMRR + userTotalSetupFees;
              
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.commissionRules && user.commissionRules.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {user.commissionRules
                          .sort((a, b) => a.threshold - b.threshold)
                          .map((rule, idx) => (
                            <li key={idx}>
                              {rule.threshold === 0 
                                ? `Base: $${rule.amount} per close`
                                : `After ${rule.threshold} closes: $${rule.amount} each`}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">No rules defined</span>
                    )}
                  </TableCell>
                  <TableCell>{userClosedLeads.length}</TableCell>
                  <TableCell>{safeFormat(userTotalRevenue)}</TableCell>
                  <TableCell>{safeFormat(userData?.commission)}</TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">
                  No users available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CommissionStructureTable;
