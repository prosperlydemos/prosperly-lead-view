
import React, { useState } from 'react';
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
import { User, Lead, CommissionRule } from '@/types';
import { calculateCommission } from '@/utils/commissionUtils';
import ClosedDealsTable from './ClosedDealsTable';
import EditCommissionDialog from './EditCommissionDialog';

interface CommissionsTabProps {
  users: User[];
  filteredLeads: Lead[];
  leaderboardData: Array<{
    id: string;
    name: string;
    commission: number;
  }>;
}

// Helper function to safely get commission amount
const getCommissionAmount = (lead: Lead, users: User[]): number => {
  // Check if commissionAmount is a valid number
  if (typeof lead.commissionAmount === 'number' && !isNaN(lead.commissionAmount)) {
    return lead.commissionAmount;
  }
  
  // If commissionAmount is malformed (like an object), fall back to calculation
  return calculateCommission(lead, users);
};

const CommissionsTab: React.FC<CommissionsTabProps> = ({ users, filteredLeads, leaderboardData }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  
  // Calculate totals for summary - only include closed deals with signup dates
  const closedLeadsWithSignupDate = filteredLeads.filter(lead => 
    lead.status === 'Closed' && lead.signupDate
  );
  
  const totalSetupFees = closedLeadsWithSignupDate
    .reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
  
  const totalMRR = closedLeadsWithSignupDate
    .reduce((sum, lead) => sum + (lead.mrr || 0), 0);
    
  // Calculate total commissions with proper handling of malformed amounts
  const totalCommissions = closedLeadsWithSignupDate
    .reduce((sum, lead) => {
      const commissionAmount = getCommissionAmount(lead, users);
      return sum + commissionAmount;
    }, 0);

  const handleEditCommission = (lead: Lead) => {
    const owner = users.find(user => user.id === lead.ownerId) || null;
    setSelectedLead(lead);
    setSelectedOwner(owner);
    setIsEditDialogOpen(true);
  };

  return (
    <TabsContent value="commissions">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Revenue Summary</CardTitle>
          <CardDescription>
            Overview of revenue and commissions for the selected time period (based on signup dates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Total Setup Fees</div>
              <div className="text-2xl font-bold">${totalSetupFees.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Total MRR</div>
              <div className="text-2xl font-bold">${totalMRR.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">Total Commissions Paid</div>
              <div className="text-2xl font-bold">${totalCommissions.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Commission Structure</CardTitle>
          <CardDescription>
            Current commission rules for each team member (based on signup dates)
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
                // Only count closed deals with signup dates
                const userClosedLeads = filteredLeads.filter(lead => 
                  lead.ownerId === user.id && 
                  lead.status === 'Closed' &&
                  lead.signupDate
                );
                
                // Calculate the total revenue for each user's closed leads
                const userTotalMRR = userClosedLeads.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
                const userTotalSetupFees = userClosedLeads.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
                const userTotalRevenue = userTotalMRR + userTotalSetupFees;
                
                // Calculate total commission earned with proper handling of malformed amounts
                const userTotalCommission = userClosedLeads.reduce((sum, lead) => {
                  const commissionAmount = getCommissionAmount(lead, users);
                  return sum + commissionAmount;
                }, 0);
                
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
                    <TableCell>${userTotalRevenue.toLocaleString()}</TableCell>
                    <TableCell>${userTotalCommission.toLocaleString()}</TableCell>
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

      <ClosedDealsTable
        filteredLeads={filteredLeads}
        users={users}
        onEditCommission={handleEditCommission}
      />

      {selectedLead && selectedOwner && (
        <EditCommissionDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedLead(null);
            setSelectedOwner(null);
          }}
          lead={selectedLead}
          owner={selectedOwner}
          onCommissionUpdated={() => {
            // Trigger a refresh of the data
            setIsEditDialogOpen(false);
            setSelectedLead(null);
            setSelectedOwner(null);
          }}
        />
      )}
    </TabsContent>
  );
};

export default CommissionsTab;
