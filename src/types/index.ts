
export type LeadStatus = 'Demo Scheduled' | 'Warm Lead' | 'Hot Lead' | 'Closed' | 'Lost' | 'Demo No Show';

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
  demoBookedDate: string | null; // When the demo was booked/scheduled
  signupDate: string | null;
  status: LeadStatus;
  ownerId: string; // ID of the user who owns this lead
  closedAt?: string; // Date when the lead was closed
  crm?: string; // CRM system the lead uses
  nextFollowUp?: string | null; // Date for the next follow-up
  value: number; // Added the value field to match Supabase schema
  location?: string; // US state or Canadian city
  commissionAmount?: number; // Custom commission amount for this lead
  vertical?: string; // Business vertical/industry
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  userId?: string; // Added to match Supabase user_id
}
