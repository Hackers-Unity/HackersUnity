-- ==============================================================================
-- Hacker's Unity Platform - Registration Fields & Custom Questions Migration
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Ensure events table has registration_fields column and custom_questions
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS registration_fields TEXT[] DEFAULT ARRAY['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills']::TEXT[],
  ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- 2. Ensure registrations table has dedicated columns for all optional registration fields
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS discord_handle TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS tshirt_size TEXT,
  ADD COLUMN IF NOT EXISTS dietary_preference TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

-- 3. Update existing events to have default registration fields if NULL
UPDATE public.events
SET registration_fields = ARRAY['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills']::TEXT[]
WHERE registration_fields IS NULL;
