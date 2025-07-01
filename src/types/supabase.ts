
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';
import { parseDateToISO, formatDateForInput } from '@/utils/dateUtils';

// Directly use Supabase generated types
export type Profile = SupabaseDatabase['public']['Tables']['profiles']['Row'];
export type Lead = SupabaseDatabase['public']['Tables']['leads']['Row'] & {
  // Add these fields that were added via our SQL migrations but may not be in the generated types yet
  lead_source?: string | null;
  setup_fee?: number | null;
  mrr?: number | null;
  demo_date?: string | null;
  signup_date?: string | null;
  crm?: string | null;
  location?: string | null;
  vertical?: string | null;
};
export type Note = SupabaseDatabase['public']['Tables']['notes']['Row'];

export interface SupabaseUser {
  id: string;
  email: string;
}

// Helper function to map Supabase Lead to App Lead
export const mapSupabaseLeadToAppLead = (supabaseLead: Lead): import('./index').Lead => {
  // Ensure numeric values are always numbers, not null or undefined
  const setupFee = typeof supabaseLead.setup_fee === 'number' ? supabaseLead.setup_fee : 0;
  const mrr = typeof supabaseLead.mrr === 'number' ? supabaseLead.mrr : 0;
  const value = typeof supabaseLead.value === 'number' ? supabaseLead.value : 0;
  
  // Format dates consistently as YYYY-MM-DD strings without timezone adjustment
  const formatDate = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // Parse the date string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.error("Invalid date format:", dateStr);
        return null;
      }
      
      // Format as YYYY-MM-DD without timezone adjustment
      return dateStr.split('T')[0];
    } catch (e) {
      console.error("Error formatting date:", dateStr, e);
      return null;
    }
  };
  
  return {
    id: supabaseLead.id,
    contactName: supabaseLead.contact_name,
    email: supabaseLead.email || '',
    businessName: supabaseLead.business_name || '',
    leadSource: supabaseLead.lead_source || '', 
    setupFee: setupFee,
    mrr: mrr,
    demoDate: formatDate(supabaseLead.demo_date),
    signupDate: formatDate(supabaseLead.signup_date),
    status: supabaseLead.status as import('./index').LeadStatus,
    ownerId: supabaseLead.owner_id,
    closedAt: formatDate(supabaseLead.closing_date),
    nextFollowUp: formatDate(supabaseLead.next_follow_up),
    crm: supabaseLead.crm || '',
    value: value,
    location: supabaseLead.location || '',
    commissionAmount: typeof supabaseLead.commission_amount === 'number' ? supabaseLead.commission_amount : undefined,
    vertical: supabaseLead.vertical || ''
  };
};

// Helper function to map App Lead to Supabase Lead
export const mapAppLeadToSupabaseLead = (appLead: import('./index').Lead): {
  id?: string;
  contact_name: string;
  email?: string | null;
  business_name?: string | null;
  lead_source?: string | null;
  setup_fee?: number | null;
  mrr?: number | null;
  demo_date?: string | null;
  signup_date?: string | null;
  status: string;
  owner_id: string;
  closing_date?: string | null;
  next_follow_up?: string | null;
  value: number;
  crm?: string | null;
  phone?: string | null;
  location?: string | null;
  commission_amount?: number | null;
  vertical?: string | null;
} => {
  // Use parseDateToISO for consistent date formatting for Supabase
  const formatDateForSupabase = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    return parseDateToISO(new Date(dateStr));
  };

  return {
    id: appLead.id,
    contact_name: appLead.contactName,
    email: appLead.email || null,
    business_name: appLead.businessName || null,
    lead_source: appLead.leadSource || null,
    setup_fee: appLead.setupFee || 0,
    mrr: appLead.mrr || 0,
    demo_date: formatDateForSupabase(appLead.demoDate),
    signup_date: formatDateForSupabase(appLead.signupDate),
    status: appLead.status,
    owner_id: appLead.ownerId,
    closing_date: formatDateForSupabase(appLead.closedAt),
    next_follow_up: formatDateForSupabase(appLead.nextFollowUp),
    value: appLead.value || 0,
    crm: appLead.crm || null,
    phone: null,
    location: appLead.location || null,
    commission_amount: appLead.commissionAmount !== undefined ? appLead.commissionAmount : null,
    vertical: appLead.vertical || null
  };
};
