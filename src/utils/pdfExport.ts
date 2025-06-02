
import jsPDF from 'jspdf';
import { User, Lead } from '@/types';
import { calculateCommission, formatDate } from './commissionUtils';

interface PdfExportData {
  users: User[];
  filteredLeads: Lead[];
  dateRange: { from: Date; to: Date } | null;
  selectedUserId?: string;
}

export const exportCommissionsPDF = ({ users, filteredLeads, dateRange, selectedUserId }: PdfExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options?: { fontSize?: number; fontStyle?: string; maxWidth?: number }) => {
    if (options?.fontSize) doc.setFontSize(options.fontSize);
    if (options?.fontStyle) doc.setFont('helvetica', options.fontStyle as any);
    
    if (options?.maxWidth) {
      const lines = doc.splitTextToSize(text, options.maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * (options.fontSize || 12) * 0.4);
    } else {
      doc.text(text, x, y);
      return y + ((options?.fontSize || 12) * 0.4);
    }
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title
  yPosition = addText('Commission Report', 20, yPosition, { fontSize: 20, fontStyle: 'bold' });
  yPosition += 10;

  // Date range
  if (dateRange) {
    const dateText = `Period: ${formatDate(dateRange.from.toISOString())} - ${formatDate(dateRange.to.toISOString())}`;
    yPosition = addText(dateText, 20, yPosition, { fontSize: 12 });
  }
  yPosition += 5;

  // Filter info
  const filterText = selectedUserId && selectedUserId !== 'all' 
    ? `Sales Rep: ${users.find(u => u.id === selectedUserId)?.name || 'Unknown'}`
    : 'All Sales Reps';
  yPosition = addText(filterText, 20, yPosition, { fontSize: 12 });
  yPosition += 15;

  // Filter users and leads based on selection
  const targetUsers = selectedUserId && selectedUserId !== 'all' 
    ? users.filter(user => user.id === selectedUserId)
    : users;

  const closedDeals = filteredLeads.filter(lead => lead.status === 'Closed');

  // Revenue Summary
  checkPageBreak(60);
  yPosition = addText('REVENUE SUMMARY', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
  yPosition += 10;

  const totalSetupFees = closedDeals.reduce((sum, lead) => sum + (lead.setupFee || 0), 0);
  const totalMRR = closedDeals.reduce((sum, lead) => sum + (lead.mrr || 0), 0);
  const totalCommissions = closedDeals.reduce((sum, lead) => {
    const commissionAmount = lead.commissionAmount !== undefined && lead.commissionAmount !== null
      ? lead.commissionAmount
      : calculateCommission(lead, users);
    return sum + commissionAmount;
  }, 0);

  yPosition = addText(`Total Setup Fees: $${totalSetupFees.toLocaleString()}`, 20, yPosition);
  yPosition = addText(`Total MRR: $${totalMRR.toLocaleString()}`, 20, yPosition);
  yPosition = addText(`Total Commissions Paid: $${totalCommissions.toLocaleString()}`, 20, yPosition);
  yPosition += 15;

  // Commission Structure
  checkPageBreak(100);
  yPosition = addText('COMMISSION STRUCTURE', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
  yPosition += 10;

  targetUsers.forEach(user => {
    checkPageBreak(40);
    
    yPosition = addText(`${user.name} (${user.email})`, 20, yPosition, { fontSize: 12, fontStyle: 'bold' });
    
    // Commission rules
    if (user.commissionRules && user.commissionRules.length > 0) {
      user.commissionRules
        .sort((a, b) => a.threshold - b.threshold)
        .forEach(rule => {
          const ruleText = rule.threshold === 0 
            ? `  Base: $${rule.amount} per close`
            : `  After ${rule.threshold} closes: $${rule.amount} each`;
          yPosition = addText(ruleText, 30, yPosition, { fontSize: 10 });
        });
    } else {
      yPosition = addText('  No commission rules defined', 30, yPosition, { fontSize: 10 });
    }

    // User stats
    const userClosedLeads = filteredLeads.filter(lead => 
      lead.ownerId === user.id && lead.status === 'Closed'
    );
    
    const userTotalRevenue = userClosedLeads.reduce((sum, lead) => 
      sum + (lead.mrr || 0) + (lead.setupFee || 0), 0);
    
    const userTotalCommission = userClosedLeads.reduce((sum, lead) => {
      const commissionAmount = lead.commissionAmount !== undefined && lead.commissionAmount !== null
        ? lead.commissionAmount
        : calculateCommission(lead, users);
      return sum + commissionAmount;
    }, 0);

    yPosition = addText(`  Closed Deals: ${userClosedLeads.length}`, 30, yPosition, { fontSize: 10 });
    yPosition = addText(`  Total Revenue: $${userTotalRevenue.toLocaleString()}`, 30, yPosition, { fontSize: 10 });
    yPosition = addText(`  Total Earned: $${userTotalCommission.toLocaleString()}`, 30, yPosition, { fontSize: 10 });
    yPosition += 10;
  });

  // Closed Deals Table
  checkPageBreak(100);
  yPosition = addText('CLOSED DEALS', 20, yPosition, { fontSize: 16, fontStyle: 'bold' });
  yPosition += 10;

  // Sort deals by closing date
  const sortedDeals = [...closedDeals].sort((a, b) => {
    const dateA = a.closedAt ? new Date(a.closedAt).getTime() : 0;
    const dateB = b.closedAt ? new Date(b.closedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Filter deals by selected user if applicable
  const targetDeals = selectedUserId && selectedUserId !== 'all'
    ? sortedDeals.filter(deal => deal.ownerId === selectedUserId)
    : sortedDeals;

  if (targetDeals.length === 0) {
    yPosition = addText('No closed deals in the selected time period.', 20, yPosition);
  } else {
    // Table headers
    yPosition = addText('Date', 20, yPosition, { fontSize: 10, fontStyle: 'bold' });
    addText('Business', 70, yPosition, { fontSize: 10, fontStyle: 'bold' });
    addText('Owner', 120, yPosition, { fontSize: 10, fontStyle: 'bold' });
    addText('Setup Fee', 150, yPosition, { fontSize: 10, fontStyle: 'bold' });
    addText('MRR', 180, yPosition, { fontSize: 10, fontStyle: 'bold' });
    yPosition = addText('Commission', 210, yPosition, { fontSize: 10, fontStyle: 'bold' });
    yPosition += 5;

    // Add a line under headers
    doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);
    yPosition += 5;

    targetDeals.forEach(deal => {
      checkPageBreak(15);
      
      const owner = users.find(user => user.id === deal.ownerId);
      const commissionAmount = deal.commissionAmount !== undefined && deal.commissionAmount !== null
        ? deal.commissionAmount
        : calculateCommission(deal, users);

      yPosition = addText(formatDate(deal.closedAt), 20, yPosition, { fontSize: 9 });
      addText(deal.businessName || deal.contactName || 'N/A', 70, yPosition, { fontSize: 9, maxWidth: 45 });
      addText(owner?.name || 'Unassigned', 120, yPosition, { fontSize: 9, maxWidth: 25 });
      addText(`$${(deal.setupFee || 0).toLocaleString()}`, 150, yPosition, { fontSize: 9 });
      addText(`$${(deal.mrr || 0).toLocaleString()}`, 180, yPosition, { fontSize: 9 });
      yPosition = addText(`$${commissionAmount.toLocaleString()}`, 210, yPosition, { fontSize: 9 });
      yPosition += 3;
    });
  }

  // Generate filename
  const dateStr = dateRange 
    ? `${dateRange.from.toISOString().split('T')[0]}_to_${dateRange.to.toISOString().split('T')[0]}`
    : 'all_time';
  
  const userStr = selectedUserId && selectedUserId !== 'all'
    ? `_${users.find(u => u.id === selectedUserId)?.name?.replace(/\s+/g, '_') || 'unknown'}`
    : '_all_reps';

  const filename = `commission_report_${dateStr}${userStr}.pdf`;

  // Save the PDF
  doc.save(filename);
};
