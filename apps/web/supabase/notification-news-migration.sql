-- ==============================================================================
-- Hacker's Unity Platform - Notification & News System Migration
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- ─── 1. NOTIFICATIONS TABLE (Master notification records) ─────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system'
    CHECK (type IN ('event', 'registration', 'reminder', 'announcement', 'team', 'result', 'system', 'news')),
  icon TEXT DEFAULT '🔔',
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  news_id UUID,
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'specific_user', 'event_participants', 'event_organizers', 'team_members', 'selected_users')),
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. USER NOTIFICATIONS TABLE (Per-user delivery) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, notification_id)
);

-- ─── 3. NEWS TABLE (Platform news & updates) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'platform_updates'
    CHECK (category IN ('hackathons', 'technology', 'ai', 'competitions', 'internships', 'opportunities', 'platform_updates')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from notifications to news (after news table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_news_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_news_id_fkey
      FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 4. INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read
  ON public.user_notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
  ON public.user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON public.notifications (type);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_event_id
  ON public.notifications (event_id);

CREATE INDEX IF NOT EXISTS idx_notifications_sender_id
  ON public.notifications (sender_id);

CREATE INDEX IF NOT EXISTS idx_news_slug
  ON public.news (slug);

CREATE INDEX IF NOT EXISTS idx_news_status_published
  ON public.news (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_category
  ON public.news (category);

CREATE INDEX IF NOT EXISTS idx_news_author
  ON public.news (author_id);

-- ─── 5. ROW LEVEL SECURITY ───────────────────────────────────────────────────

-- Notifications: public read, admin/organizer insert
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications are viewable by authenticated users" ON public.notifications;
CREATE POLICY "Notifications are viewable by authenticated users" ON public.notifications
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins and organizers can create notifications" ON public.notifications;
CREATE POLICY "Admins and organizers can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = sender_id);

-- User Notifications: users can only access their own
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert user notifications" ON public.user_notifications;
CREATE POLICY "Authenticated users can insert user notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.user_notifications;
CREATE POLICY "Users can mark own notifications as read" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.user_notifications;
CREATE POLICY "Users can delete own notifications" ON public.user_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- News: public read published, author/admin manage
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published news is viewable by everyone" ON public.news;
CREATE POLICY "Published news is viewable by everyone" ON public.news
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = author_id
  );

DROP POLICY IF EXISTS "Authenticated users can create news" ON public.news;
CREATE POLICY "Authenticated users can create news" ON public.news
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authors can update own news" ON public.news;
CREATE POLICY "Authors can update own news" ON public.news
  FOR UPDATE USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own news" ON public.news;
CREATE POLICY "Authors can delete own news" ON public.news
  FOR DELETE USING (auth.uid() = author_id);

-- ─── 6. NEWS SLUG AUTO-GENERATION TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_news_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(TRIM(NEW.title));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');

    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'news';
    END IF;

    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.news WHERE slug = final_slug) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_news_slug ON public.news;
CREATE TRIGGER trigger_generate_news_slug
  BEFORE INSERT ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_news_slug();

-- ─── 7. NEWS UPDATED_AT AUTO-UPDATE ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_news_updated_at ON public.news;
CREATE TRIGGER trigger_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_news_updated_at();

-- ─── 8. ENABLE SUPABASE REALTIME ON USER_NOTIFICATIONS ───────────────────────
-- This enables instant notification delivery via Supabase Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
