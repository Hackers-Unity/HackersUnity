-- ============================================================================
-- Team Invitations Table Migration (Idempotent / Safe to run multiple times)
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Create team_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  -- Prevent duplicate pending invites to the same email for the same team
  CONSTRAINT unique_pending_invite UNIQUE (team_id, invited_email)
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_event_id ON public.team_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_email ON public.team_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invite_token ON public.team_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);

-- 3. Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for team_invitations (Safe re-creation)

DROP POLICY IF EXISTS "Allow read access to team_invitations" ON public.team_invitations;
CREATE POLICY "Allow read access to team_invitations"
  ON public.team_invitations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert invitations" ON public.team_invitations;
CREATE POLICY "Allow authenticated users to insert invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update invitations" ON public.team_invitations;
CREATE POLICY "Allow authenticated users to update invitations"
  ON public.team_invitations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete invitations" ON public.team_invitations;
CREATE POLICY "Allow authenticated users to delete invitations"
  ON public.team_invitations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 5. Ensure team_members has a DELETE policy (for leaving squad)
DROP POLICY IF EXISTS "Allow authenticated users to delete team_members" ON public.team_members;
CREATE POLICY "Allow authenticated users to delete team_members"
  ON public.team_members FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 6. Ensure teams has a DELETE policy (for squad leaders deleting their squad)
DROP POLICY IF EXISTS "Allow authenticated users to delete teams" ON public.teams;
CREATE POLICY "Allow authenticated users to delete teams"
  ON public.teams FOR DELETE
  USING (auth.uid() IS NOT NULL);


