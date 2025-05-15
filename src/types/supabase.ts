
import { Lead as AppLead, Note as AppNote, LeadStatus, User } from '@/types';

export type Lead = AppLead;
export type Note = AppNote;

/**
 * Maps a Supabase lead object to our application's Lead type
 */
export function mapSupabaseLeadToAppLead(supabaseLead: any): AppLead {
  return {
    id: supabaseLead.id || '',
    contactName: supabaseLead.contact_name || '',
    email: supabaseLead.email || '',
    businessName: supabaseLead.business_name || '',
    leadSource: supabaseLead.lead_source || '',
    setupFee: typeof supabaseLead.setup_fee === 'number' ? supabaseLead.setup_fee : 0,
    mrr: typeof supabaseLead.mrr === 'number' ? supabaseLead.mrr : 0,
    demoDate: supabaseLead.demo_date ? supabaseLead.demo_date : null,
    signupDate: supabaseLead.signup_date ? supabaseLead.signup_date : null,
    status: supabaseLead.status || 'Demo Scheduled',
    ownerId: supabaseLead.owner_id || '',
    closedAt: supabaseLead.closing_date || null,
    nextFollowUp: supabaseLead.next_follow_up || null,
    crm: supabaseLead.crm || '',
    value: typeof supabaseLead.value === 'number' ? supabaseLead.value : 0,
    location: supabaseLead.location || '',
    commissionAmount: supabaseLead.commission_amount,
  };
}

/**
 * Maps our application's Lead type to a Supabase lead object
 */
export function mapAppLeadToSupabaseLead(appLead: AppLead): any {
  return {
    id: appLead.id,
    contact_name: appLead.contactName,
    email: appLead.email,
    business_name: appLead.businessName,
    lead_source: appLead.leadSource,
    setup_fee: appLead.setupFee,
    mrr: appLead.mrr,
    demo_date: appLead.demoDate,
    signup_date: appLead.signupDate,
    status: appLead.status,
    owner_id: appLead.ownerId,
    closing_date: appLead.closedAt,
    next_follow_up: appLead.nextFollowUp,
    crm: appLead.crm,
    value: appLead.value,
    location: appLead.location,
    commission_amount: appLead.commissionAmount
  };
}

// Export type aliases to prevent import issues in other files
export type { AppLead, AppNote, User };

// Alias for Supabase's Profile type
export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  is_admin: boolean;
  closed_deals: number | null;
  total_commission: number | null;
  commission_rules: any | null;
  created_at: string;
  updated_at: string;
};
