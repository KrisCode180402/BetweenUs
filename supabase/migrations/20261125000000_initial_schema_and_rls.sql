-- ==============================================================================
-- BETWEEN US — SUPABASE SCHEMA & HARDENED ROW LEVEL SECURITY MIGRATION
-- ==============================================================================

-- 1. Device Cryptographic Identities (Public Keys & Fingerprints Only)
CREATE TABLE IF NOT EXISTS public.device_identities (
  id text PRIMARY KEY,
  name text NOT NULL,
  fingerprint text NOT NULL UNIQUE,
  spki_hex text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

-- 2. Paired Couples
CREATE TABLE IF NOT EXISTS public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

-- 3. Couple Device Memberships
CREATE TABLE IF NOT EXISTS public.couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  device_id text NOT NULL REFERENCES public.device_identities(id) ON DELETE CASCADE,
  device_name text,
  joined_at timestamptz DEFAULT now()
);

-- 4. Ephemeral One-Time Pairing Sessions
CREATE TABLE IF NOT EXISTS public.pairing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_device_id text NOT NULL REFERENCES public.device_identities(id) ON DELETE CASCADE,
  initiator_device_name text NOT NULL,
  pairing_code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status = ANY (ARRAY['PENDING'::text, 'REQUESTED'::text, 'ACCEPTED'::text, 'REJECTED'::text, 'EXPIRED'::text])),
  target_device_id text REFERENCES public.device_identities(id) ON DELETE SET NULL,
  target_device_name text,
  couple_id uuid REFERENCES public.couples(id) ON DELETE SET NULL,
  attempts integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Indexes for fast pairing lookups
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_code_hash_status
  ON public.pairing_sessions (pairing_code_hash, status);
CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id
  ON public.couple_members (couple_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.device_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_sessions ENABLE ROW LEVEL SECURITY;

-- Revoke public execution on helper SECURITY DEFINER trigger functions if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END $$;

-- Strict Operation-Scoped Policies (No DELETE permitted; immutable couples/members)
CREATE POLICY "device_identities_select_active"
  ON public.device_identities FOR SELECT TO anon, authenticated
  USING (length(id) >= 16);

CREATE POLICY "device_identities_insert_valid"
  ON public.device_identities FOR INSERT TO anon, authenticated
  WITH CHECK (length(id) >= 16 AND id = fingerprint AND length(name) <= 100);

CREATE POLICY "device_identities_update_valid"
  ON public.device_identities FOR UPDATE TO anon, authenticated
  USING (length(id) >= 16)
  WITH CHECK (length(id) >= 16 AND id = fingerprint AND length(name) <= 100);

CREATE POLICY "pairing_sessions_select_recent"
  ON public.pairing_sessions FOR SELECT TO anon, authenticated
  USING (expires_at > now() - interval '24 hours');

CREATE POLICY "pairing_sessions_insert_pending"
  ON public.pairing_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'PENDING'
    AND length(pairing_code_hash) = 64
    AND expires_at > now() - interval '1 hour'
    AND expires_at <= now() + interval '24 hours'
  );

CREATE POLICY "pairing_sessions_update_active"
  ON public.pairing_sessions FOR UPDATE TO anon, authenticated
  USING (status IN ('PENDING', 'REQUESTED') AND expires_at > now() - interval '1 hour')
  WITH CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED'));

CREATE POLICY "couples_select_recent"
  ON public.couples FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '24 hours');

CREATE POLICY "couples_insert_valid"
  ON public.couples FOR INSERT TO anon, authenticated
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "couple_members_select_recent"
  ON public.couple_members FOR SELECT TO anon, authenticated
  USING (joined_at > now() - interval '24 hours');

CREATE POLICY "couple_members_insert_valid"
  ON public.couple_members FOR INSERT TO anon, authenticated
  WITH CHECK (couple_id IS NOT NULL AND length(device_id) >= 16);
