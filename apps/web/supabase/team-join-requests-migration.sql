-- ==============================================================================
-- Team Join Requests Migration
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- Enables join requests for squads with leader approval workflow
-- ==============================================================================

-- 1. Create team_join_requests table
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  skills TEXT[],
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_event_id ON public.team_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_user_id ON public.team_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON public.team_join_requests(status);

-- 3. Enable RLS
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Allow read access to team_join_requests" ON public.team_join_requests;
CREATE POLICY "Allow read access to team_join_requests"
  ON public.team_join_requests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert team_join_requests" ON public.team_join_requests;
CREATE POLICY "Allow authenticated users to insert team_join_requests"
  ON public.team_join_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update team_join_requests" ON public.team_join_requests;
CREATE POLICY "Allow authenticated users to update team_join_requests"
  ON public.team_join_requests FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete team_join_requests" ON public.team_join_requests;
CREATE POLICY "Allow authenticated users to delete team_join_requests"
  ON public.team_join_requests FOR DELETE
  USING (auth.uid() IS NOT NULL);
