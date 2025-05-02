
export type LeadStatus = 'Demo Scheduled' | 'Warm' | 'Hot' | 'Closed';

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
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
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
}
