-- ==============================================================================
-- HACKER'S UNITY — SUPABASE REALTIME BROADCAST & REPLICATION SETUP
-- ==============================================================================
-- Run this script in the Supabase SQL Editor to enable Realtime Broadcast & 
-- Postgres Changes across all hackathons, registrations, and teams.

-- 1. Enable replication for realtime postgres_changes on target tables (Safe / Idempotent)
DO $$
DECLARE
  tbl text;
  tables_to_add text[] := ARRAY['events', 'registrations', 'teams', 'team_members', 'profiles'];
BEGIN
  FOREACH tbl IN ARRAY tables_to_add
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl
    ) AND NOT EXISTS (
      SELECT 1 
      FROM pg_publication_rel pr
      JOIN pg_publication p ON p.oid = pr.prpubid
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE p.pubname = 'supabase_realtime' 
        AND n.nspname = 'public' 
        AND c.relname = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    END IF;
  END LOOP;
END $$;

-- 2. Realtime Broadcast Authorization & Policies
-- Note: 'realtime.messages' table manages broadcast & presence auth
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'realtime' AND table_name = 'messages'
  ) THEN
    -- Allow everyone (authenticated + anon) to listen to public event broadcasts
    EXECUTE '
      DROP POLICY IF EXISTS "Anyone can receive broadcasts" ON realtime.messages;
      CREATE POLICY "Anyone can receive broadcasts"
      ON realtime.messages
      FOR SELECT
      TO anon, authenticated
      USING (true);
    ';

    -- Allow authenticated and anon clients to send broadcast events
    EXECUTE '
      DROP POLICY IF EXISTS "Anyone can send broadcasts" ON realtime.messages;
      CREATE POLICY "Anyone can send broadcasts"
      ON realtime.messages
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    ';
  END IF;
END $$;

-- 3. Automatic Registration Counter Trigger
-- When a user registers, automatically increment registration_count on the event
CREATE OR REPLACE FUNCTION public.handle_new_registration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registration_count = COALESCE(registration_count, 0) + 1,
      updated_at = NOW()
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_created ON public.registrations;
CREATE TRIGGER on_registration_created
  AFTER INSERT ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_registration();

-- 4. Automatic Registration Decrement on Cancel / Delete
CREATE OR REPLACE FUNCTION public.handle_deleted_registration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registration_count = GREATEST(0, COALESCE(registration_count, 1) - 1),
      updated_at = NOW()
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_deleted ON public.registrations;
CREATE TRIGGER on_registration_deleted
  AFTER DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_registration();

-- 5. RPC Helper for manual registration increment if needed
CREATE OR REPLACE FUNCTION public.increment_event_registrations(p_event_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events
  SET registration_count = COALESCE(registration_count, 0) + 1,
      updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
