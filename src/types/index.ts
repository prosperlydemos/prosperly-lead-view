
export type LeadStatus = 'Demo Scheduled' | 'Warm' | 'Hot' | 'Closed';

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
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
}
