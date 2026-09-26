import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncsdpcryhkszzpjnejvk.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jc2RwY3J5aGtzenpwam5lanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzEyNDksImV4cCI6MjEwNTgwNzI0OX0.SquMwTbLPYowTIJHlDYbQR050yLI501ngQK7j0LcAT4";

/**
 * Singleton Supabase Client Instance.
 * Used for authentication verification and ephemeral Realtime signaling channels.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
