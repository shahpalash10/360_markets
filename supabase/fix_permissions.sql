-- ==============================================================================
-- 360 MARKETS: COMPREHENSIVE RLS POLICIES & SCHEMA REPAIR SCRIPT
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dyhphvibuczflpkbtxxb/sql/new
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add missing columns to trader_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trader_applications' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.trader_applications ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trader_applications' AND column_name = 'certification_id'
  ) THEN
    ALTER TABLE public.trader_applications ADD COLUMN certification_id TEXT;
  END IF;
END $$;

-- 3. Add missing columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_certified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'certification_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN certification_id TEXT;
  END IF;
END $$;

-- 4. Add missing columns to trader_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trader_profiles' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE public.trader_profiles ADD COLUMN is_certified BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trader_profiles' AND column_name = 'certified_at'
  ) THEN
    ALTER TABLE public.trader_profiles ADD COLUMN certified_at TIMESTAMPTZ;
  END IF;
  
  -- Create enrollments table if not exists
  CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id),
    CONSTRAINT enrollments_user_webinar_unique UNIQUE (user_id, webinar_id)
  );

END $$;

-- 5. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or Admin update all" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;

DROP POLICY IF EXISTS "Trader profiles viewable by everyone" ON public.trader_profiles;
DROP POLICY IF EXISTS "Trader update own profile" ON public.trader_profiles;
DROP POLICY IF EXISTS "Trader insert own profile" ON public.trader_profiles;
DROP POLICY IF EXISTS "Admin full access on trader_profiles" ON public.trader_profiles;

DROP POLICY IF EXISTS "Trader application viewable by applicant or admin" ON public.trader_applications;
DROP POLICY IF EXISTS "Trader create application" ON public.trader_applications;
DROP POLICY IF EXISTS "Admin update applications" ON public.trader_applications;
DROP POLICY IF EXISTS "Trader applications public insert" ON public.trader_applications;
DROP POLICY IF EXISTS "Trader applications select policy" ON public.trader_applications;
DROP POLICY IF EXISTS "Trader applications insert policy" ON public.trader_applications;
DROP POLICY IF EXISTS "Trader applications update policy" ON public.trader_applications;

DROP POLICY IF EXISTS "Courses viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Traders can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Traders can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Traders can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Traders and Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Traders and Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Traders and Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admin full access on courses" ON public.courses;

-- 7. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile or Admin update all" 
  ON public.profiles FOR UPDATE USING (
    (select auth.uid()) = id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  ) WITH CHECK (
    (select auth.uid()) = id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

-- 8. TRADER PROFILES POLICIES
CREATE POLICY "Trader profiles viewable by everyone" 
  ON public.trader_profiles FOR SELECT USING (true);

CREATE POLICY "Trader insert own profile" 
  ON public.trader_profiles FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

CREATE POLICY "Trader update own profile" 
  ON public.trader_profiles FOR UPDATE USING (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  ) WITH CHECK (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

-- 9. TRADER APPLICATIONS POLICIES
CREATE POLICY "Trader applications select policy" 
  ON public.trader_applications FOR SELECT USING (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

CREATE POLICY "Trader applications insert policy" 
  ON public.trader_applications FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
  );

CREATE POLICY "Trader applications update policy" 
  ON public.trader_applications FOR UPDATE USING (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  ) WITH CHECK (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

-- 10. COURSES POLICIES (Allow Traders & Admins to INSERT, UPDATE, DELETE)
CREATE POLICY "Courses viewable by everyone" 
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "Traders and Admins can insert courses" 
  ON public.courses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

CREATE POLICY "Traders and Admins can update courses" 
  ON public.courses FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

CREATE POLICY "Traders and Admins can delete courses" 
  ON public.courses FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

-- 11. WEBINARS POLICIES (Allow Traders & Admins to INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Webinars viewable by everyone" ON public.webinars;
DROP POLICY IF EXISTS "Traders and Admins can insert webinars" ON public.webinars;
DROP POLICY IF EXISTS "Traders and Admins can update webinars" ON public.webinars;
DROP POLICY IF EXISTS "Traders and Admins can delete webinars" ON public.webinars;

CREATE POLICY "Webinars viewable by everyone" 
  ON public.webinars FOR SELECT USING (true);

CREATE POLICY "Traders and Admins can insert webinars" 
  ON public.webinars FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

CREATE POLICY "Traders and Admins can update webinars" 
  ON public.webinars FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

CREATE POLICY "Traders and Admins can delete webinars" 
  ON public.webinars FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND role IN ('TRADER', 'ADMIN')
    )
  );

-- 12. ENROLLMENTS POLICIES
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrollments viewable by owner or admin" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;

CREATE POLICY "Enrollments viewable by owner or admin" 
  ON public.enrollments FOR SELECT USING (
    (select auth.uid()) = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'ADMIN')
  );

CREATE POLICY "Users can enroll themselves" 
  ON public.enrollments FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
  );

-- 13. REPAIR USER REGISTRATION LANGUAGE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    display_name, 
    avatar_url, 
    country, 
    language, 
    role, 
    onboarding_completed, 
    onboarding_step
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'),
    'United States',
    COALESCE(NEW.raw_user_meta_data->>'language', 'EN'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'INVESTOR'),
    TRUE,
    4
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



