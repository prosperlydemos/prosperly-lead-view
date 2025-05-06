
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';

export type Profile = SupabaseDatabase['public']['Tables']['profiles']['Row'];
export type Lead = SupabaseDatabase['public']['Tables']['leads']['Row'];
export type Note = SupabaseDatabase['public']['Tables']['notes']['Row'];

export interface SupabaseUser {
  id: string;
  email: string;
}
