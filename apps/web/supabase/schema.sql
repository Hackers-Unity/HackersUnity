-- ==============================================================================
-- Hacker's Unity Platform - Complete Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Hacker & Organizer Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'PARTICIPANT' CHECK (role IN ('PARTICIPANT', 'ORGANIZER', 'ADMIN', 'JUDGE')),
  college TEXT,
  organization TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  elo_score INTEGER DEFAULT 1200,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS TABLE (Hackathons, Sprints & Competitions)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'HACKATHON' CHECK (category IN ('HACKATHON', 'COMPETITION', 'WORKSHOP', 'HIRING_CHALLENGE', 'QUIZ')),
  event_type TEXT DEFAULT 'ONLINE' CHECK (event_type IN ('ONLINE', 'OFFLINE', 'HYBRID')),
  location TEXT DEFAULT 'Online / Discord',
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  organizer_avatar TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  total_prize_value NUMERIC DEFAULT 0,
  prizes JSONB DEFAULT '[]'::jsonb,
  tracks JSONB DEFAULT '[]'::jsonb,
  stages JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  sponsors JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 4,
  is_team_event BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  participants_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED')),
  banner_gradient TEXT DEFAULT 'from-sky-50 via-white to-orange-50/60',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE (Event Sign-ups)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  is_team BOOLEAN DEFAULT FALSE,
  team_name TEXT,
  role TEXT DEFAULT 'Team Lead & Builder',
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELLED')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 4. BOOKMARKS TABLE (Saved Hackathons)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 5. TEAMS / SQUADS TABLE (Teammates Matchmaking)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  looking_for TEXT[] DEFAULT '{}',
  description TEXT,
  max_members INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBMISSIONS TABLE (Hackathon Project Submissions)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  demo_url TEXT,
  video_url TEXT,
  track TEXT,
  score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'WINNER', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies (Idempotent)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, authenticated user update own profile
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events: Public read published events, organizers manage own events
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

-- Registrations: User can view & manage their own registrations
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
CREATE POLICY "Users can view their own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can register for events" ON public.registrations;
CREATE POLICY "Users can register for events" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookmarks: User can view & manage their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Teams: Public read, squad leaders manage squad
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- Submissions: Public read submitted projects, submitter can insert/update
DROP POLICY IF EXISTS "Submissions viewable by everyone" ON public.submissions;
CREATE POLICY "Submissions viewable by everyone" ON public.submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can submit projects" ON public.submissions;
CREATE POLICY "Users can submit projects" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = submitter_id);
