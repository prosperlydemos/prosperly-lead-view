
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';

// Directly use Supabase generated types
export type Profile = SupabaseDatabase['public']['Tables']['profiles']['Row'];
export type Lead = SupabaseDatabase['public']['Tables']['leads']['Row'];
export type Note = SupabaseDatabase['public']['Tables']['notes']['Row'];

export interface SupabaseUser {
  id: string;
  email: string;
}

// Helper function to map Supabase Lead to App Lead
export const mapSupabaseLeadToAppLead = (supabaseLead: Lead): import('./index').Lead => {
  return {
    id: supabaseLead.id,
    contactName: supabaseLead.contact_name,
    email: supabaseLead.email || '',
    businessName: supabaseLead.business_name || '',
    leadSource: supabaseLead.lead_source || '', 
    setupFee: supabaseLead.setup_fee || 0,
    mrr: supabaseLead.mrr || 0,
    demoDate: supabaseLead.demo_date ? supabaseLead.demo_date : null,
    signupDate: supabaseLead.signup_date || null,
    status: supabaseLead.status as import('./index').LeadStatus,
    ownerId: supabaseLead.owner_id,
    closedAt: supabaseLead.closing_date || undefined,
    nextFollowUp: supabaseLead.next_follow_up || null,
    crm: supabaseLead.crm || '',
    value: supabaseLead.value
  };
};

// Helper function to map App Lead to Supabase Lead
export const mapAppLeadToSupabaseLead = (appLead: import('./index').Lead): Partial<Lead> => {
  return {
    id: appLead.id,
    contact_name: appLead.contactName,
    email: appLead.email || null,
    business_name: appLead.businessName || null,
    lead_source: appLead.leadSource || null,
    setup_fee: appLead.setupFee || 0,
    mrr: appLead.mrr || 0,
    demo_date: appLead.demoDate || null,
    signup_date: appLead.signupDate || null,
    status: appLead.status,
    owner_id: appLead.ownerId,
    closing_date: appLead.closedAt || null,
    next_follow_up: appLead.nextFollowUp || null,
    value: appLead.value || 0,
    crm: appLead.crm || null,
    phone: null // Assuming this field exists but is optional
  };
};
