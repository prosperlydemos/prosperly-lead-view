
import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { User, Lead } from '@/types';
import EditCommissionDialog from './EditCommissionDialog';
import { useToast } from '@/hooks/use-toast';
import RevenueSummaryCard from './RevenueSummaryCard';
import CommissionStructureTable from './CommissionStructureTable';
import ClosedDealsTable from './ClosedDealsTable';
import { calculateCommission } from './utils/commissionUtils';

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
    
  // Calculate total commissions from both custom and calculated commission amounts
  const totalCommissions = filteredLeads
    .filter(lead => lead.status === 'Closed')
    .reduce((sum, lead) => {
      // Use the stored commission amount if available, otherwise calculate it
      const commissionAmount = lead.commissionAmount !== undefined && lead.commissionAmount !== null
        ? lead.commissionAmount
        : calculateCommission(lead, users);
      return sum + commissionAmount;
    }, 0);

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

  return (
    <TabsContent value="commissions">
      {/* Revenue Summary Card */}
      <RevenueSummaryCard 
        totalSetupFees={totalSetupFees}
        totalMRR={totalMRR}
        totalCommissions={totalCommissions}
      />

      {/* Commission Structure Table */}
      <CommissionStructureTable 
        users={users}
        leaderboardData={leaderboardData}
        filteredLeads={filteredLeads}
      />

      {/* Closed Deals Table */}
      <ClosedDealsTable 
        filteredLeads={filteredLeads}
        users={users}
        onEditCommission={handleEditCommission}
      />

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
