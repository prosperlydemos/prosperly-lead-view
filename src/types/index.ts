
export type LeadStatus = 'Demo Scheduled' | 'Warm' | 'Hot' | 'Closed';

export interface CommissionRule {
  threshold: number; // Number of closes before this rule applies
  amount: number;    // Commission amount per close
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  commissionRules?: CommissionRule[];
  totalCommission?: number;
  closedDeals?: number;
}

export interface Lead {
  id: string;
  contactName: string;
  email: string;
  businessName: string;
  leadSource: string;
  setupFee: number;
  mrr: number; // Monthly Recurring Revenue
  demoDate: string | null;
  signupDate: string | null;
  status: LeadStatus;
  ownerId: string; // ID of the user who owns this lead
  closedAt?: string; // Date when the lead was closed
  crm?: string; // CRM system the lead uses
  nextFollowUp?: string | null; // Date for the next follow-up
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
}
