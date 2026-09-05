-- ==============================================================================
-- Hacker's Unity Platform - Migration v3 (Dynamic Realtime Event Platform)
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- ─── 1. TEAM MEMBERS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('LEADER', 'MEMBER')),
  status TEXT DEFAULT 'ACCEPTED' CHECK (status IN ('INVITED', 'ACCEPTED', 'DECLINED')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Team members: viewable by team members, manageable by leader
DROP POLICY IF EXISTS "Team members can view their team" ON public.team_members;
CREATE POLICY "Team members can view their team" ON public.team_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT leader_id FROM public.teams WHERE id = team_id)
  );

DROP POLICY IF EXISTS "Team leaders can add members" ON public.team_members;
CREATE POLICY "Team leaders can add members" ON public.team_members
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT leader_id FROM public.teams WHERE id = team_id)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Team leaders can remove members" ON public.team_members;
CREATE POLICY "Team leaders can remove members" ON public.team_members
  FOR DELETE USING (
    auth.uid() IN (SELECT leader_id FROM public.teams WHERE id = team_id)
    OR auth.uid() = user_id
  );

-- ─── 2. ADD MISSING EVENT COLUMNS ──────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS registration_count INTEGER DEFAULT 0;

-- ─── 3. IMPROVED RLS POLICIES FOR EVENTS ───────────────────────────────────
-- Drop the old overly-permissive SELECT policy
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;

-- New: Published events are public, drafts only visible to organizer
CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT USING (
    status IN ('PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED')
    OR (auth.uid() = organizer_id)
  );

-- Add DELETE policy for organizers
CREATE POLICY "Organizers can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = organizer_id);

-- ─── 4. IMPROVED RLS FOR REGISTRATIONS ─────────────────────────────────────
-- Drop old policies to recreate with improvements
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;

-- Users can view their own registrations, organizers can view registrations for their events
CREATE POLICY "Users and organizers can view registrations" ON public.registrations
  FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT organizer_id FROM public.events WHERE id = event_id
    )
  );

-- ─── 5. REGISTRATION COUNT TRIGGER ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_registration_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events
    SET registration_count = registration_count + 1,
        updated_at = NOW()
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events
    SET registration_count = GREATEST(registration_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_registration_count ON public.registrations;
CREATE TRIGGER trigger_update_registration_count
  AFTER INSERT OR DELETE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_registration_count();

-- ─── 6. AUTO-SLUG GENERATION FUNCTION ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Slugify: lowercase, replace non-alphanumeric with hyphens, trim hyphens
  base_slug := LOWER(TRIM(base_title));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');

  -- If empty, use a default
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'event';
  END IF;

  final_slug := base_slug;

  -- Check for collisions and append counter
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ─── 7. INDEXES FOR PERFORMANCE ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events (start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams (event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);

-- ─── 8. ENABLE SUPABASE REALTIME ───────────────────────────────────────────
-- Enable realtime on the events table so new published events appear automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- ─── 9. SEED MOCK EVENTS ──────────────────────────────────────────────────
-- Insert the 7 existing events as seed data (skip if already exist)
INSERT INTO public.events (
  slug, title, description, category, event_type, location,
  organizer_name, organizer_avatar, start_date, end_date, registration_deadline,
  total_prize_value, prizes, tracks, stages, faqs, sponsors, tags,
  min_team_size, max_team_size, is_team_event, featured,
  participants_count, registration_count, status, banner_gradient, created_at
) VALUES
(
  'codewars',
  'CodeWars Hackathon',
  'Get ready to build, innovate, and compete at a National-Level 24-Hour Hackathon powered by Hacker''s Unity. Whether you are into AI/ML, Web Development, Blockchain, IoT, or Cybersecurity — bring your idea, build it, and ship it!',
  'HACKATHON', 'OFFLINE', 'Jaipur, Rajasthan',
  'Hacker''s Unity', '⚔️',
  '2026-08-22T00:00:00Z', '2026-08-23T23:59:59Z', '2026-08-22T23:59:59Z',
  50000,
  '[{"position":"🥇 Grand Winner","amount":30000,"description":"Cash prize + Trophy + Certifications + Direct Venture Support"},{"position":"🥈 1st Runner Up","amount":15000,"description":"Cash prize + Swag Kits + Fast-track Interviews"},{"position":"🥉 2nd Runner Up","amount":5000,"description":"Cash prize + Goodies & Swag Kit"}]'::jsonb,
  '[{"title":"AI/ML & Intelligent Systems","prize":"₹20,000 Pool","description":"Autonomous agents, computer vision, NLP applications."},{"title":"Web3 & Decentralized Protocols","prize":"₹15,000 Pool","description":"Smart contracts, DeFi, cross-chain applications."},{"title":"IoT & Hardware Automation","prize":"₹15,000 Pool","description":"Smart embedded devices, sensors, industrial automation."}]'::jsonb,
  '[{"id":"stg_1","eventId":"codewars","stageName":"Registration & Verification","stageOrder":1,"startDate":"2026-08-01T00:00:00Z","endDate":"2026-08-22T23:59:59Z","description":"Form teams and submit your registration details."},{"id":"stg_2","eventId":"codewars","stageName":"24-Hour Offline Hackathon","stageOrder":2,"startDate":"2026-08-22T09:00:00Z","endDate":"2026-08-23T09:00:00Z","description":"Non-stop hacking, mentoring rounds, and milestone checkpoints."},{"id":"stg_3","eventId":"codewars","stageName":"Final Pitch & Grand Awards","stageOrder":3,"startDate":"2026-08-23T10:00:00Z","endDate":"2026-08-23T14:00:00Z","description":"Live demos in front of industry judges and prize distribution."}]'::jsonb,
  '[{"id":"faq_1","eventId":"codewars","question":"What is the team size?","answer":"Teams can have between 2 to 4 members.","createdAt":"2026-08-01T00:00:00Z"},{"id":"faq_2","eventId":"codewars","question":"Is it an offline or online event?","answer":"CodeWars is an in-person, 24-hour hackathon hosted at ACEIT.","createdAt":"2026-08-01T00:00:00Z"}]'::jsonb,
  '[{"name":"Hacker''s Unity","tier":"Title Partner","logoText":"HU"},{"name":"ACEIT","tier":"Host Partner","logoText":"ACEIT"}]'::jsonb,
  ARRAY['AI/ML', 'Blockchain', 'Web3', 'IoT', 'FinTech', 'Open Innovation'],
  2, 4, true, true,
  500, 500, 'PUBLISHED', 'from-amber-900/60 via-orange-950/80 to-black', '2026-08-01T00:00:00Z'
),
(
  'clash-of-coders',
  'Clash Of Coders',
  'Join Hacker''s Unity for an electrifying 24-hour hackathon where your creativity, coding skills, and problem-solving abilities will be pushed to the next level.',
  'HACKATHON', 'OFFLINE', 'Offline Arena / Hub',
  'Hacker''s Unity', '⚡',
  '2026-08-23T00:00:00Z', '2026-08-24T23:59:59Z', '2026-08-03T23:59:59Z',
  2100,
  '[{"position":"🥇 Top Winners Pool","amount":2100,"description":"$2100 USD Prize Pool + Exclusive Swag & Goodies Kit"}]'::jsonb,
  '[{"title":"DeFi & Payment Systems","prize":"$1,000 Pool","description":"Decentralized liquidity, payment rails, on-chain analytics."},{"title":"dApps & User Onboarding","prize":"$1,100 Pool","description":"Web3 UX primitives, account abstraction, consumer applications."}]'::jsonb,
  '[{"id":"stg_coc_1","eventId":"clash-of-coders","stageName":"Registration","stageOrder":1,"startDate":"2026-07-15T00:00:00Z","endDate":"2026-08-03T23:59:59Z","description":"Register on the portal and form squads."},{"id":"stg_coc_2","eventId":"clash-of-coders","stageName":"Hackathon Day","stageOrder":2,"startDate":"2026-08-23T09:00:00Z","endDate":"2026-08-24T09:00:00Z","description":"24-Hour offline coding showdown."}]'::jsonb,
  '[{"id":"faq_coc_1","eventId":"clash-of-coders","question":"Can I participate solo?","answer":"Yes, individual participants as well as teams up to 3 are welcome.","createdAt":"2026-07-15T00:00:00Z"}]'::jsonb,
  '[{"name":"Hacker''s Unity","tier":"Organizer","logoText":"HU"}]'::jsonb,
  ARRAY['Blockchain', 'Web3', 'Innovation'],
  1, 3, true, true,
  500, 500, 'PUBLISHED', 'from-blue-900/60 via-indigo-950/80 to-black', '2026-07-15T00:00:00Z'
),
(
  'chatgpt-codex',
  'Chatgpt Codex Hackathon',
  'Build real-world AI applications using ChatGPT Codex, collaborate with mentors, showcase your innovation, and compete with some of India''s brightest AI builders.',
  'HACKATHON', 'ONLINE', 'Online / Virtual',
  'Hacker''s Unity X BlockseBlock', '🤖',
  '2026-07-23T00:00:00Z', '2026-08-03T23:59:59Z', '2026-08-03T23:59:59Z',
  12000,
  '[{"position":"🥇 Top Performer","amount":null,"description":"Codex Pro Access for 1 Year + Mentorship & Ecosystem Grants"}]'::jsonb,
  '[{"title":"Generative Coding Agents","prize":"Codex Pro Licenses","description":"Autonomous tools leveraging OpenAI Codex architectures."}]'::jsonb,
  '[{"id":"stg_cgc_1","eventId":"chatgpt-codex","stageName":"Submissions Closed","stageOrder":1,"startDate":"2026-07-23T00:00:00Z","endDate":"2026-08-03T23:59:59Z","description":"Challenge ended successfully."}]'::jsonb,
  '[{"id":"faq_cgc_1","eventId":"chatgpt-codex","question":"Is this event completed?","answer":"Yes, this hackathon has concluded successfully.","createdAt":"2026-07-01T00:00:00Z"}]'::jsonb,
  '[{"name":"Hacker''s Unity","tier":"Organizer","logoText":"HU"},{"name":"BlockseBlock","tier":"Co-Organizer","logoText":"BSB"}]'::jsonb,
  ARRAY['OpenAI', 'CodexHackathon2026', 'Codex', 'Innovation'],
  1, 1, false, true,
  500, 500, 'COMPLETED', 'from-emerald-950/60 via-teal-950/80 to-black', '2026-07-01T00:00:00Z'
),
(
  'kestra-orchestration',
  'Kestra Orchestration Challenge',
  'Hacker''s Unity is proud to be a community partner for The Kestra Orchestration Challenge by WeMakeDevs, powered by Kestra. Learn workflow orchestration, get your certificate, and win Apple MacBook, iPad, iPhone, and more worth $4,000.',
  'HACKATHON', 'ONLINE', 'Online / WeMakeDevs Community',
  'WeMakeDevs', '⚙️',
  '2026-05-01T00:00:00Z', '2026-06-30T23:59:59Z', '2026-06-30T23:59:59Z',
  4000,
  '[{"position":"🥇 Top Tier Rewards","amount":4000,"description":"Apple MacBook, iPad, iPhone + Kestra Goodies worth $4,000 USD"}]'::jsonb,
  '[{"title":"Workflow Orchestration with Kestra","prize":"$4,000 Pool","description":"Declarative YAML data orchestration workflows."}]'::jsonb,
  '[{"id":"stg_koc_1","eventId":"kestra-orchestration","stageName":"Challenge Completed","stageOrder":1,"startDate":"2026-05-01T00:00:00Z","endDate":"2026-06-30T23:59:59Z","description":"Event completed with 1000+ participating builders."}]'::jsonb,
  '[{"id":"faq_koc_1","eventId":"kestra-orchestration","question":"What was the community role of Hacker''s Unity?","answer":"Hacker''s Unity was the official community partner.","createdAt":"2026-04-20T00:00:00Z"}]'::jsonb,
  '[{"name":"WeMakeDevs","tier":"Host","logoText":"WMD"},{"name":"Kestra","tier":"Powered By","logoText":"KESTRA"}]'::jsonb,
  ARRAY['Open Source', 'DevOps', 'Workflow Automation'],
  1, 1, false, true,
  1000, 1000, 'COMPLETED', 'from-purple-950/60 via-slate-900/80 to-black', '2026-04-20T00:00:00Z'
),
(
  'hackvision-2026',
  'Hackvision',
  'Hacker''s Unity proudly presents HackVision, a premier hackathon where innovators, developers, and problem-solvers come together to build solutions that matter.',
  'HACKATHON', 'ONLINE', 'Devpost / Virtual',
  'Hacker''s Unity', '🔮',
  '2026-03-28T00:00:00Z', '2026-04-05T23:59:59Z', '2026-04-05T23:59:59Z',
  100000,
  '[{"position":"🥇 Grand Prize Pool","amount":100000,"description":"₹1,00,000 INR Cash Prize Pool + Devpost Global Hall of Fame"}]'::jsonb,
  '[{"title":"Open Innovation & Social Good","prize":"₹1,00,000 Pool","description":"Solve meaningful real-world challenges across healthcare, education, sustainability."}]'::jsonb,
  '[{"id":"stg_hv_1","eventId":"hackvision-2026","stageName":"Archived / Completed","stageOrder":1,"startDate":"2026-03-28T00:00:00Z","endDate":"2026-04-05T23:59:59Z","description":"Successfully completed on Devpost."}]'::jsonb,
  '[{"id":"faq_hv_1","eventId":"hackvision-2026","question":"Where can I see past submissions?","answer":"All project submissions are published on Devpost.","createdAt":"2026-03-01T00:00:00Z"}]'::jsonb,
  '[{"name":"Hacker''s Unity","tier":"Host","logoText":"HU"}]'::jsonb,
  ARRAY['Innovation', 'Development', 'Open Ended'],
  1, 3, true, true,
  1500, 1500, 'COMPLETED', 'from-violet-950/60 via-slate-900/80 to-black', '2026-03-01T00:00:00Z'
),
(
  'hackstorm-2025',
  'HACKSTORM - Code the Storm',
  'Join Hacker''s Unity for an electrifying 24-hour hackathon where your creativity, coding skills, and problem-solving abilities are put to the ultimate test.',
  'HACKATHON', 'OFFLINE', 'In-Person Arena',
  'Hacker''s Unity', '⚡',
  '2025-10-31T00:00:00Z', '2025-11-01T23:59:59Z', '2025-11-01T23:59:59Z',
  200000,
  '[{"position":"🥇 Grand Champions Pool","amount":200000,"description":"₹2,00,000 INR Cash Prize Pool + Devfolio Badges & Swag"}]'::jsonb,
  '[{"title":"Autonomous Intelligence & Web3","prize":"₹2,00,000 Pool","description":"Next-gen distributed tools and intelligent applications."}]'::jsonb,
  '[{"id":"stg_hs_1","eventId":"hackstorm-2025","stageName":"Finished","stageOrder":1,"startDate":"2025-10-31T00:00:00Z","endDate":"2025-11-01T23:59:59Z","description":"Successfully wrapped up on Devfolio."}]'::jsonb,
  '[{"id":"faq_hs_1","eventId":"hackstorm-2025","question":"Where was Hackstorm hosted?","answer":"It was hosted on Devfolio with live in-person hacking.","createdAt":"2025-09-01T00:00:00Z"}]'::jsonb,
  '[{"name":"Hacker''s Unity","tier":"Organizer","logoText":"HU"}]'::jsonb,
  ARRAY['AI', 'Agents & Automation', 'Web3/Blockchain'],
  2, 6, true, true,
  800, 800, 'COMPLETED', 'from-amber-950/60 via-yellow-950/80 to-black', '2025-09-01T00:00:00Z'
),
(
  'wchl-2025',
  'WCHL 2025 - World Computer Hacker League',
  'The World Computer Hacker League (WCHL) 2025 is a global hackathon led by the ICP HUBS Network.',
  'HACKATHON', 'ONLINE', 'Unstop / Global Virtual',
  'ICP HUBS Network', '🌐',
  '2025-07-01T00:00:00Z', '2025-07-25T23:59:59Z', '2025-07-25T23:59:59Z',
  300000,
  '[{"position":"🏆 Global ICP Ecosystem Pool","amount":300000,"description":"$300,000+ USD in Grants, Seed Bounties, and ICP Tokens"}]'::jsonb,
  '[{"title":"Decentralized Cloud & ICP Canisters","prize":"$300K+ Pool","description":"Next-gen decentralized computation on the ICP world computer."}]'::jsonb,
  '[{"id":"stg_wchl_1","eventId":"wchl-2025","stageName":"Finished","stageOrder":1,"startDate":"2025-07-01T00:00:00Z","endDate":"2025-07-25T23:59:59Z","description":"Global event completed on Unstop."}]'::jsonb,
  '[{"id":"faq_wchl_1","eventId":"wchl-2025","question":"What was the prize pool?","answer":"Over $300,000+ in prizes and development grants.","createdAt":"2025-06-01T00:00:00Z"}]'::jsonb,
  '[{"name":"ICP HUBS Network","tier":"Lead Organizer","logoText":"ICP"},{"name":"Hacker''s Unity","tier":"Community Partner","logoText":"HU"}]'::jsonb,
  ARRAY['Web3', 'Blockchain', 'ICP'],
  1, 5, true, true,
  2000, 2000, 'COMPLETED', 'from-sky-950/60 via-blue-950/80 to-black', '2025-06-01T00:00:00Z'
)
ON CONFLICT (slug) DO NOTHING;

-- ─── 10. SYNC EXISTING REGISTRATION COUNTS ────────────────────────────────
-- Update registration_count for any events that already have registrations
UPDATE public.events e
SET registration_count = (
  SELECT COUNT(*) FROM public.registrations r WHERE r.event_id = e.id
)
WHERE EXISTS (SELECT 1 FROM public.registrations r WHERE r.event_id = e.id);

-- ─── 11. ENHANCED PROFILE COLUMNS FOR BUILDERS & PROFESSIONALS ─────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
  ADD COLUMN IF NOT EXISTS profession_type TEXT DEFAULT 'STUDENT',
  ADD COLUMN IF NOT EXISTS degree TEXT,
  ADD COLUMN IF NOT EXISTS branch TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS experience_years TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

