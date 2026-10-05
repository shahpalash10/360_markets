-- ==============================================================================
-- 360° MARKETS PLATFORM: COMPLETE CONSOLIDATED POSTGRESQL / SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dyhphvibuczflpkbtxxb/sql/new
-- ==============================================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  country TEXT DEFAULT 'United States',
  language TEXT DEFAULT 'EN',
  role TEXT NOT NULL DEFAULT 'INVESTOR' CHECK (role IN ('INVESTOR', 'TRADER', 'ADMIN')),
  is_certified BOOLEAN DEFAULT FALSE,
  certification_id TEXT,
  certification_status TEXT,
  onboarding_completed BOOLEAN DEFAULT TRUE,
  onboarding_step INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVESTOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_interests JSONB DEFAULT '["Stock Trading", "Options Strategies"]'::jsonb,
  learning_goals JSONB DEFAULT '["Build new quantitative trading skills"]'::jsonb,
  hours_learned NUMERIC DEFAULT 0.0,
  active_courses_count INT DEFAULT 0,
  certificates_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRADER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.trader_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_title TEXT DEFAULT 'Stock Educator & Quant',
  bio TEXT DEFAULT 'Quantitative Stock Trading Specialist',
  expertise JSONB DEFAULT '["Equities", "Derivatives", "Algorithms"]'::jsonb,
  years_experience INT DEFAULT 3,
  is_certified BOOLEAN DEFAULT FALSE,
  certification_status TEXT NOT NULL DEFAULT 'pending',
  certification_id TEXT,
  certified_at TIMESTAMPTZ,
  rating NUMERIC DEFAULT 5.0,
  total_subscribers INT DEFAULT 0,
  total_courses INT DEFAULT 0,
  total_webinars INT DEFAULT 0,
  gross_revenue NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRADER APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.trader_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  expertise TEXT NOT NULL,
  experience_years INT NOT NULL DEFAULT 3,
  bio TEXT NOT NULL,
  portfolio_url TEXT,
  documents_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  certification_id TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id UUID REFERENCES public.trader_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT DEFAULT 'Beginner',
  language TEXT DEFAULT 'English',
  price NUMERIC NOT NULL DEFAULT 0.0,
  is_subscription BOOLEAN DEFAULT FALSE,
  thumbnail TEXT,
  published BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 4.9,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  webinar_id UUID,
  progress_percentage NUMERIC DEFAULT 0.0,
  is_completed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id)
);

-- 7. INVITATION CODES TABLE
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  scope TEXT NOT NULL DEFAULT 'SIGNALS', -- 'ALL_ACCESS', 'SIGNALS', 'COURSE', 'TRADER_BUNDLE'
  tier TEXT DEFAULT 'SIGNALS',
  target_course_id TEXT,
  target_course_title TEXT,
  target_course_slug TEXT,
  creator_role TEXT NOT NULL DEFAULT 'ADMIN', -- 'ADMIN', 'TRADER'
  creator_id TEXT DEFAULT 'user-admin-demo',
  creator_name TEXT DEFAULT 'System Admin',
  duration_days INTEGER NOT NULL DEFAULT 30, -- 9999 = Lifetime
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'EXPIRED'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CODE REDEMPTIONS TABLE
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

-- 9. SIGNALS TABLE
CREATE TABLE IF NOT EXISTS public.signals (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  market TEXT DEFAULT 'US',
  action TEXT NOT NULL DEFAULT 'BUY',
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  timeframe TEXT DEFAULT 'SWING',
  risk_reward TEXT,
  notes TEXT,
  provider_name TEXT DEFAULT 'Alex Morgan',
  provider_avatar TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Allow public read access on standard directories
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Trader profiles viewable by everyone" ON public.trader_profiles;
CREATE POLICY "Trader profiles viewable by everyone" ON public.trader_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Courses viewable by everyone" ON public.courses;
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read invitation codes" ON public.invitation_codes;
CREATE POLICY "Public read invitation codes" ON public.invitation_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read signals" ON public.signals;
CREATE POLICY "Public read signals" ON public.signals FOR SELECT USING (true);

-- Allow authenticated and admin full writes
DROP POLICY IF EXISTS "Full access invitation codes" ON public.invitation_codes;
CREATE POLICY "Full access invitation codes" ON public.invitation_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access code redemptions" ON public.code_redemptions;
CREATE POLICY "Full access code redemptions" ON public.code_redemptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access signals" ON public.signals;
CREATE POLICY "Full access signals" ON public.signals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access enrollments" ON public.enrollments;
CREATE POLICY "Full access enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

-- Seed initial master invitation codes
INSERT INTO public.invitation_codes (id, code, scope, tier, creator_role, creator_name, duration_days, max_uses, used_count, status, notes)
VALUES
  ('inv-001', 'TRADINGEASY', 'ALL_ACCESS', 'ALL_ACCESS', 'ADMIN', 'System Admin', 365, 1000, 142, 'ACTIVE', 'Official TradingEasy partnership master pass (Signals + Courses)'),
  ('inv-002', 'ALPHA2026', 'SIGNALS', 'SIGNALS', 'ADMIN', 'System Admin', 90, 500, 88, 'ACTIVE', 'Q4 Quantitative Signals VIP access voucher'),
  ('inv-003', 'VIP888', 'SIGNALS', 'SIGNALS', 'TRADER', 'Alex Morgan', 30, 200, 45, 'ACTIVE', 'Educator community fast-track signal pass'),
  ('inv-004', 'QUANT101', 'COURSE', 'ALL_ACCESS', 'TRADER', 'Alex Morgan', 9999, 100, 22, 'ACTIVE', 'Direct course voucher for Quant Stock Trading masterclass')
ON CONFLICT (code) DO NOTHING;
