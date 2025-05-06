
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

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  closedDeals: number;
  totalValue: number;
  commission: number;
}

interface LeaderboardTabProps {
  leaderboardData: LeaderboardUser[];
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ leaderboardData }) => {
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
              {leaderboardData.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.closedDeals}</TableCell>
                  <TableCell>${user.totalValue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${user.commission.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {leaderboardData.length === 0 && (
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
