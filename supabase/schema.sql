-- Supabase PostgreSQL Schema & RLS Policies for 360° MARKETS Platform

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PUBLIC PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  country TEXT DEFAULT 'United States',
  language TEXT DEFAULT 'EN',
  role TEXT NOT NULL CHECK (role IN ('INVESTOR', 'TRADER', 'ADMIN')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INVESTOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  learning_interests JSONB DEFAULT '[]'::jsonb,
  learning_goals JSONB DEFAULT '[]'::jsonb,
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
  professional_title TEXT,
  bio TEXT,
  expertise JSONB DEFAULT '[]'::jsonb,
  years_experience INT DEFAULT 0,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  certification_status TEXT NOT NULL DEFAULT 'pending' CHECK (certification_status IN ('pending', 'under_review', 'certified', 'rejected', 'suspended')),
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
  experience_years INT NOT NULL,
  bio TEXT NOT NULL,
  portfolio_url TEXT,
  documents_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id UUID NOT NULL REFERENCES public.trader_profiles(id) ON DELETE CASCADE,
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

-- 6. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id UUID NOT NULL REFERENCES public.trader_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_mb NUMERIC DEFAULT 1.0,
  price NUMERIC NOT NULL DEFAULT 0.0,
  download_url TEXT NOT NULL,
  preview_url TEXT,
  downloads_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 4.8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WEBINARS TABLE
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id UUID NOT NULL REFERENCES public.trader_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INT DEFAULT 60,
  price NUMERIC NOT NULL DEFAULT 0.0,
  max_attendees INT DEFAULT 100,
  filled_seats INT DEFAULT 0,
  meeting_url TEXT NOT NULL,
  status TEXT DEFAULT 'UPCOMING',
  replay_url TEXT,
  thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CERTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  trader_name TEXT NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  verification_url TEXT NOT NULL
);

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Investor Profiles Policies
CREATE POLICY "Investor profiles viewable by owner or admin" ON public.investor_profiles 
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Investor update own profile" ON public.investor_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

-- Trader Profiles Policies
CREATE POLICY "Trader profiles viewable by everyone" ON public.trader_profiles FOR SELECT USING (true);
CREATE POLICY "Trader update own profile" ON public.trader_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trader Applications Policies
CREATE POLICY "Trader application viewable by applicant or admin" ON public.trader_applications 
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Trader create application" ON public.trader_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update applications" ON public.trader_applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- Courses/Materials/Webinars Read Policies
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Materials viewable by everyone" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Webinars viewable by everyone" ON public.webinars FOR SELECT USING (true);

-- ----------------------------------------------------
-- DATABASE TRIGGER FOR AUTH.USERS -> PUBLIC.PROFILES
-- ----------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, display_name, avatar_url, country, language, role, onboarding_completed, onboarding_step)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'),
    'United States',
    'EN',
    COALESCE(NEW.raw_user_meta_data->>'role', 'INVESTOR'),
    FALSE,
    1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
