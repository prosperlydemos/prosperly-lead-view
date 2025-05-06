
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
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
import { User, Lead, CommissionRule } from '@/types';

interface CommissionsTabProps {
  users: User[];
  filteredLeads: Lead[];
  leaderboardData: Array<{
    id: string;
    name: string;
    commission: number;
  }>;
}

const CommissionsTab: React.FC<CommissionsTabProps> = ({ users, filteredLeads, leaderboardData }) => {
  return (
    <TabsContent value="commissions">
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
                <TableHead>Total Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userData = leaderboardData.find(u => u.id === user.id);
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
                    <TableCell>${userData?.commission.toLocaleString() || 0}</TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                    No users available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Closed Deals</CardTitle>
          <CardDescription>
            Showing the most recently closed deals in the selected time period
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads
                .filter(lead => lead.status === 'Closed')
                .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime())
                .slice(0, 10)
                .map((lead) => {
                  const owner = users.find(u => u.id === lead.ownerId);
                  return (
                    <TableRow key={lead.id} className="border-b hover:bg-muted/50">
                      <TableCell>{lead.contactName}</TableCell>
                      <TableCell>{lead.businessName}</TableCell>
                      <TableCell>{owner?.name || 'Unknown'}</TableCell>
                      <TableCell>{lead.closedAt ? format(new Date(lead.closedAt), 'MMM d, yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-right">${lead.setupFee.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${lead.mrr.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              {filteredLeads.filter(lead => lead.status === 'Closed').length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">No closed deals in the selected time period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default CommissionsTab;
