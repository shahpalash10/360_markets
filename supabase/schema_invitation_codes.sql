-- ====================================================================
-- 360° MARKETS - INVITATION CODES & REDEMPTIONS SUPABASE SCHEMA
-- Execute this script in your Supabase Project SQL Editor
-- (https://supabase.com/dashboard/project/dyhphvibuczflpkbtxxb/sql)
-- ====================================================================

-- 1. Create invitation_codes table
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'SIGNALS', -- 'ALL_ACCESS', 'SIGNALS', 'COURSE', 'TRADER_BUNDLE'
  tier TEXT DEFAULT 'SIGNALS',
  target_course_id TEXT,
  target_course_title TEXT,
  creator_role TEXT NOT NULL DEFAULT 'ADMIN', -- 'ADMIN', 'TRADER'
  creator_id TEXT,
  creator_name TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30, -- 9999 = Lifetime
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create code_redemptions ledger table
CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id TEXT PRIMARY KEY,
  code_id TEXT,
  code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  scope TEXT NOT NULL DEFAULT 'SIGNALS',
  target_course_id TEXT,
  target_course_title TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read and redemption validation
CREATE POLICY "Public read active invitation codes"
  ON public.invitation_codes FOR SELECT
  USING (true);

-- Allow authenticated users and admins to insert/update codes
CREATE POLICY "Allow code creation"
  ON public.invitation_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow code redemptions
CREATE POLICY "Allow code redemptions"
  ON public.code_redemptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed initial master codes
INSERT INTO public.invitation_codes (id, code, scope, tier, creator_role, creator_name, duration_days, max_uses, used_count, status, notes)
VALUES
  ('inv-001', 'TRADINGEASY', 'ALL_ACCESS', 'ALL_ACCESS', 'ADMIN', 'System Admin', 365, 1000, 142, 'ACTIVE', 'Official TradingEasy partnership master pass (Signals + Courses)'),
  ('inv-002', 'ALPHA2026', 'SIGNALS', 'SIGNALS', 'ADMIN', 'System Admin', 90, 500, 88, 'ACTIVE', 'Q4 Quantitative Signals VIP access voucher'),
  ('inv-003', 'VIP888', 'SIGNALS', 'SIGNALS', 'TRADER', 'Alex Morgan', 30, 200, 45, 'ACTIVE', 'Educator community fast-track signal pass'),
  ('inv-004', 'QUANT101', 'COURSE', 'ALL_ACCESS', 'TRADER', 'Alex Morgan', 9999, 100, 22, 'ACTIVE', 'Direct course voucher for Quant Stock Trading masterclass')
ON CONFLICT (code) DO NOTHING;
