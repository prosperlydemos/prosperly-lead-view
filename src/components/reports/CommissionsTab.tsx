
import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { User, Lead, CommissionRule } from '@/types';
import EditCommissionDialog from './EditCommissionDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  // State for the edit commission dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  
  // Calculate totals for summary
  const totalSetupFees = filteredLeads
    .filter(lead => lead.status === 'Closed')
    .reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
  
  const totalMRR = filteredLeads
    .filter(lead => lead.status === 'Closed')
    .reduce((sum, lead) => sum + (lead.mrr || 0), 0);
    
  const totalCommissions = leaderboardData.reduce((sum, user) => sum + (user.commission || 0), 0);

  // Handle opening the edit commission dialog
  const handleEditCommission = (lead: Lead) => {
    const owner = users.find(user => user.id === lead.ownerId) || null;
    setSelectedLead(lead);
    setSelectedOwner(owner);
    setIsEditDialogOpen(true);
  };

  // Handle commission update
  const handleCommissionUpdated = () => {
    // Notify the user that they'll need to refresh to see updated totals
    toast({
      title: "Commission updated",
      description: "Commission has been updated. The totals will be updated on the next data refresh."
    });
    
    setIsEditDialogOpen(false);
    setSelectedLead(null);
    setSelectedOwner(null);
  };

  // Calculate commission for a lead based on owner's commission rules or use stored value
  const calculateCommission = (lead: Lead): number => {
    // If we have a stored commission amount, use that
    if (lead.commissionAmount !== undefined && lead.commissionAmount !== null) {
      return lead.commissionAmount;
    }
    
    // Otherwise calculate based on rules
    const owner = users.find(user => user.id === lead.ownerId);
    if (!owner || !owner.commissionRules || owner.commissionRules.length === 0) {
      return 0;
    }

    // Find the base rule (threshold = 0)
    const baseRule = owner.commissionRules.find(rule => rule.threshold === 0);
    if (baseRule) {
      return baseRule.amount;
    }

    // Default commission if no base rule found
    return 249;
  };

  // Safe formatter for numbers that might be null/undefined
  const safeFormat = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '$0';
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <TabsContent value="commissions">
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
                .slice(0, 10)
                .map((lead) => {
                  const owner = users.find(u => u.id === lead.ownerId);
                  const commission = calculateCommission(lead);
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
                          onClick={() => handleEditCommission(lead)}
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

      {/* Edit Commission Dialog */}
      <EditCommissionDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        lead={selectedLead}
        owner={selectedOwner}
        onCommissionUpdated={handleCommissionUpdated}
      />
    </TabsContent>
  );
};

export default CommissionsTab;
