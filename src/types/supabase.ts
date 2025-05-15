import { Lead } from '@/types';

/**
 * Maps a Supabase lead object to our application's Lead type
 */
export function mapSupabaseLeadToAppLead(supabaseLead: any): Lead {
  return {
    id: supabaseLead.id || '',
    contactName: supabaseLead.contact_name || '',
    email: supabaseLead.email || '',
    businessName: supabaseLead.business_name || '',
    leadSource: supabaseLead.lead_source || '',
    setupFee: typeof supabaseLead.setup_fee === 'number' ? supabaseLead.setup_fee : 0,
    mrr: typeof supabaseLead.mrr === 'number' ? supabaseLead.mrr : 0,
    demoDate: supabaseLead.demo_date ? new Date(supabaseLead.demo_date).toISOString() : null,
    signupDate: supabaseLead.signup_date ? new Date(supabaseLead.signup_date).toISOString() : null,
    status: supabaseLead.status || 'Demo Scheduled',
    ownerId: supabaseLead.owner_id || '',
    closedAt: supabaseLead.closing_date ? new Date(supabaseLead.closing_date).toISOString() : null,
    nextFollowUp: supabaseLead.next_follow_up ? new Date(supabaseLead.next_follow_up).toISOString() : null,
    crm: supabaseLead.crm || '',
    value: typeof supabaseLead.value === 'number' ? supabaseLead.value : 0,
    location: supabaseLead.location || '',
    commissionAmount: supabaseLead.commission_amount,
  };
}
