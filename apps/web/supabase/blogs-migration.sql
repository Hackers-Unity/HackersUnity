-- ==============================================================================
-- Hacker's Unity - Community Blogs & Admin Approval Workflow Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Create the blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  category TEXT NOT NULL DEFAULT 'Agentic AI',
  image TEXT NOT NULL,
  cover_gradient TEXT DEFAULT 'from-sky-600/30 via-cyan-600/20 to-blue-950/40',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_markdown TEXT,
  tags TEXT[] DEFAULT '{}',
  read_time TEXT DEFAULT '5 min read',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Community Builder',
  author_email TEXT,
  author_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DRAFT')),
  admin_feedback TEXT,
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 2. Indexes for fast filtering and slug lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs (slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs (status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs (category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Anyone (anon and authenticated) can view APPROVED blogs
DROP POLICY IF EXISTS "Public can view approved blogs" ON public.blogs;
CREATE POLICY "Public can view approved blogs"
  ON public.blogs
  FOR SELECT
  USING (status = 'APPROVED');

-- Authenticated users or public can submit new blogs for review
DROP POLICY IF EXISTS "Users can submit blogs for approval" ON public.blogs;
CREATE POLICY "Users can submit blogs for approval"
  ON public.blogs
  FOR INSERT
  WITH CHECK (status = 'PENDING_APPROVAL');

-- Users can update their own blogs while in DRAFT or PENDING_APPROVAL
DROP POLICY IF EXISTS "Authors can update their own pending blogs" ON public.blogs;
CREATE POLICY "Authors can update their own pending blogs"
  ON public.blogs
  FOR UPDATE
  USING (
    (select auth.uid()) = author_id 
    AND status IN ('DRAFT', 'PENDING_APPROVAL')
  )
  WITH CHECK (
    (select auth.uid()) = author_id 
    AND status IN ('DRAFT', 'PENDING_APPROVAL')
  );

-- 5. Realtime publication for live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'blogs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
  END IF;
END $$;
