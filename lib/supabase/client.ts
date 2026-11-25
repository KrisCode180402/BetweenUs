import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncsdpcryhkszzpjnejvk.supabase.co";
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable__khjZhyiUVP3jDR4hBd3lw_6qv86SBE";

/**
 * Singleton Supabase Client Instance.
 * Uses public client-safe publishable key protected by PostgreSQL Row Level Security (RLS)
 * and device-level ECDSA P-256 cryptographic signing.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
