import { createClient } from '@supabase/supabase-js';
import type { Database } from "@/types/database";

export function createSupabasePublicClient() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing env: SUPABASE_URL');
  if (!publishableKey) throw new Error('Missing env: SUPABASE_PUBLISHABLE_KEY');

  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
