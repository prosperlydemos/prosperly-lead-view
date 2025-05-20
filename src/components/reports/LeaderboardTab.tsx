
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
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
import { Lead, User } from '@/types';
import { calculateCommission } from '@/utils/commissionUtils';

interface LeaderboardTabProps {
  leaderboardData: Array<{
    id: string;
    name: string;
    email: string;
    closedDeals: number;
    totalValue: number;
    commission: number;
  }>;
  users: User[];
  filteredLeads: Lead[];
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ leaderboardData, users, filteredLeads }) => {
  // Create a modified leaderboard that takes custom commission amounts into account
  const modifiedLeaderboard = users.map(user => {
    // Find all closed deals for this user
    const userClosedLeads = filteredLeads.filter(lead => 
      lead.ownerId === user.id && 
      lead.status === 'Closed'
    );
    
    // Calculate total value (MRR + setup fees)
    const totalValue = userClosedLeads.reduce((sum, lead) => 
      sum + (lead.mrr || 0) + (lead.setupFee || 0), 0);
    
    // Calculate total commission with custom amounts
    const totalCommission = userClosedLeads.reduce((sum, lead) => {
      const commissionAmount = lead.commissionAmount !== undefined && lead.commissionAmount !== null
        ? lead.commissionAmount
        : calculateCommission(lead, users);
      return sum + commissionAmount;
    }, 0);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      closedDeals: userClosedLeads.length,
      totalValue,
      commission: totalCommission
    };
  }).sort((a, b) => b.closedDeals - a.closedDeals); // Sort by number of closed deals

  return (
    <TabsContent value="leaderboard">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Leaderboard</CardTitle>
          <CardDescription>
            Performance ranking based on number of closed deals and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead className="text-right">Commission Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modifiedLeaderboard.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.closedDeals}</TableCell>
                  <TableCell>${user.totalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${user.commission.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {modifiedLeaderboard.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No data available for the selected time period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default LeaderboardTab;
