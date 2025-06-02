
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { User, Lead } from '@/types';
import { exportCommissionsPDF } from '@/utils/pdfExport';

interface PdfExportButtonProps {
  users: User[];
  filteredLeads: Lead[];
  dateRange?: { from: Date; to: Date };
  selectedUserId?: string;
  className?: string;
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  users,
  filteredLeads,
  dateRange,
  selectedUserId,
  className
}) => {
  const handleExport = () => {
    exportCommissionsPDF({
      users,
      filteredLeads,
      dateRange: dateRange || null,
      selectedUserId
    });
  };

  return (
    <Button 
      onClick={handleExport}
      variant="outline"
      size="sm"
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
};

export default PdfExportButton;
