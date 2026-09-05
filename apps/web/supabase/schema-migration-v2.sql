-- ==============================================================================
-- Hacker's Unity Platform - Migration v2 (Hackathon Hosting & Registration Enhancements)
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Add new columns to events table for 6-step hosting flow
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS eligibility TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'OPEN',
  ADD COLUMN IF NOT EXISTS rules_text TEXT,
  ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS registration_capacity INTEGER DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS approval_mode TEXT DEFAULT 'AUTO',
  ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- 2. Add extended fields to registrations table
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;

-- 3. Storage Bucket Policy (Run after creating 'hackathon-assets' bucket in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hackathon-assets', 'hackathon-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for hackathon logos and banners
DROP POLICY IF EXISTS "Public read for hackathon assets" ON storage.objects;
CREATE POLICY "Public read for hackathon assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'hackathon-assets');

-- Authenticated upload for hackathon assets
DROP POLICY IF EXISTS "Authenticated users can upload hackathon assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload hackathon assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hackathon-assets' AND (auth.role() = 'authenticated' OR auth.role() = 'anon'));
