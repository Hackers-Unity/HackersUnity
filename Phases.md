# Hacker's Unity — Development Roadmap & Implementation Phases

> **Document Version:** 2.4.0  
> **Status:** Phase 1–5 Completed | Phase 6 In Progress  
> **Current Sprint:** Production Hardening & Microservice Expansion  

---

## 1. Roadmap Overview & Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HACKER'S UNITY ROADMAP                                │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ Phase 1: Foundation           │ ✅ Monorepo, Next.js 16, NestJS, Types      │
│ Phase 2: Core UI & Discovery  │ ✅ Landing, Hero Search, Cards, Brand       │
│ Phase 3: Supabase PostgreSQL  │ ✅ Schema v1-v3, Migrations, Realtime, RLS  │
│ Phase 4: Hosting & Squads     │ ✅ 7-Step Host, Squad Invites, Submissions  │
│ Phase 5: Notifications & Admin│ ✅ Realtime Toasts, News CMS, CSV Export    │
│ Phase 6: Production Hardening │ 🔄 NestJS API, Redis Cache, Meilisearch     │
│ Phase 7: Ecosystem Expansion  │ 📋 Escrow Payouts, Mobile App, AI Judging   │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. Detailed Phase Breakdown

### Phase 1: Monorepo Foundation & Workspace Scaffolding (100% Completed)
- [x] Initialized **Turborepo** monorepo with `pnpm@9.15.0` workspaces.
- [x] Bootstrapped `apps/web` on **Next.js 16.3.1** (App Router) and **React 19.2.8**.
- [x] Configured **TailwindCSS v4** with `@tailwindcss/postcss` and custom brand variables.
- [x] Bootstrapped `apps/api` with **NestJS 11.0.1** and Express platform.
- [x] Built `packages/shared-types` containing shared DTOs, enums, and API interfaces.
- [x] Configured `docker-compose.yml` for local PostgreSQL 16, Redis 7, and Meilisearch 1.12.

### Phase 2: Core Platform Experience & Discovery UI (100% Completed)
- [x] Designed responsive landing page (`/`) with ambient radial mesh, metrics ticker, and live hackathons.
- [x] Built interactive `<HeroSearch />` with debounced instant lookup and category pills.
- [x] Implemented `<HackathonCard />` featuring dynamic countdown timers, prize badges, and bookmarking.
- [x] Created hackathon directory (`/hackathons`) and universal tech events explorer (`/events`).
- [x] Developed Hacker Matchmaking Arena (`/teammates`) with role and tech filters.
- [x] Built Global Arena Rankings (`/leaderboard`) with Rank 1-3 podiums and Elo scoring.
- [x] Established official **Brand Guidelines** page (`/brand-guidelines`) with asset download specifications.

### Phase 3: Supabase PostgreSQL Schema & Realtime Engine (100% Completed)
- [x] **Schema v1 (`schema.sql`):** Created `profiles`, `events`, `registrations`, `bookmarks`, `teams`, and `submissions`.
- [x] **Migration v2 (`schema-migration-v2.sql`):** Added 6-step hosting fields, custom questionnaire JSONB schemas, extended registration fields, and configured `hackathon-assets` Supabase Storage bucket.
- [x] **Migration v3 (`schema-migration-v3.sql`):** Created `team_members`, implemented automatic registration count triggers (`update_registration_count`), auto-slug generation, B-Tree performance indexes, and enabled `supabase_realtime` on `events`.
- [x] **Team Invitations (`team-invitations-migration.sql`):** Created `team_invitations` table with 24-byte cryptographic tokens (`gen_random_bytes(24)`).
- [x] **Notification & News Migration (`notification-news-migration.sql`):** Built `notifications`, `user_notifications`, and `news` tables with Realtime WebSocket publication.

### Phase 4: 7-Step Event Hosting & Squad Matchmaking (100% Completed)
- [x] Developed comprehensive **7-Step Hackathon Host Wizard** (`/host`):
  - Step 1: Basic Info & Interactive `<VenuePicker />`.
  - Step 2: Date, Schedule & Timezone validation.
  - Step 3: Rich text description (`<RichTextEditor />`) & difficulty settings.
  - Step 4: Multi-tier prize pool calculator, tracks, and sponsors.
  - Step 5: Capacity, registration mode (Free vs. Paid mail generator), and custom questionnaire builder.
  - Step 6: Configurable project submission deliverables.
  - Step 7: Live interactive preview and Supabase publishing.
- [x] Built Edit Mode in `/host` to modify live hackathons seamlessly.
- [x] Implemented solo and team registration wizard (`/hackathons/[slug]/register`).
- [x] Implemented tokenized team invite acceptance engine (`/hackathons/[slug]/invite`).
- [x] Integrated transactional email dispatch route (`/api/invite-email`) using Nodemailer.
- [x] Built Project Submission Modal (`<ProjectSubmissionModal />`) with repo, demo, and video verification.
- [x] Built interactive canvas croppers (`<AvatarUpload />` & `<BannerUpload />`).

### Phase 5: Notification Engine, News Magazine & Admin Console (100% Completed)
- [x] Built flyout `<NotificationPanel />` with unread badges, mark-as-read, and type icons.
- [x] Built real-time toast alert system (`<NotificationToast />`) connected to Supabase WebSockets.
- [x] Built News Magazine (`/news` & `/news/[slug]`) with category filters and social sharing.
- [x] Built Admin Broadcast & Editorial Console (`/admin/notifications`):
  - Multi-target notification dispatcher (`all`, `event_participants`, `specific_user`).
  - News article publishing studio with automatic push notification trigger.
  - Broadcast history log.
- [x] Developed Event Registrations Manager (`/dashboard/events/[eventId]/registrations`):
  - Roster view with search, filter, and approve/reject actions.
  - 1-Click CSV / Spreadsheet download with custom question responses.

---

## 3. Current Phase: Production Hardening & Microservice Migration (Phase 6)

### Status: In Progress 🔄
1. **NestJS API Service Expansion (`apps/api`):**
   - Migrate direct client queries for heavy operations (analytics, bulk registration processing, audit logging) into NestJS controllers.
   - Implement Supabase JWT verification guards in NestJS (`@supabase/server`).
2. **Redis Caching Layer:**
   - Integrate Redis for caching high-frequency public queries (e.g., active hackathons, global leaderboards).
   - Rate-limiting sensitive endpoints (`/api/invite-email`, `/api/registrations`).
3. **Full-Text Search Engine:**
   - Connect Meilisearch container to index hackathon descriptions, tags, and hacker skill sets for instant sub-millisecond search.
4. **Automated Testing Suite:**
   - Jest unit tests for utility functions, date math, and slug generation.
   - End-to-end integration tests for the 7-step hosting wizard and registration flows.

---

## 4. Future Roadmap: Ecosystem Expansion (Phase 7)

### 4.1. Milestone 7.1 — Payment Gateway & Prize Escrow
- Integration with Stripe / Razorpay for paid registration ticketing.
- Automated prize escrow payouts directly to winning team bank accounts or crypto wallets.

### 4.2. Milestone 7.2 — Automated Judging & Evaluation System
- Dedicated Judge Portal with custom scoring rubrics (Innovation, Tech Complexity, Design, Presentation).
- Blind review mode and automated score aggregation to produce podium standings.

### 4.3. Milestone 7.3 — Hacker's Unity Mobile Application
- Cross-platform iOS and Android mobile app built with React Native / Expo.
- Shared data contracts from `packages/shared-types`.
- Push notifications via Firebase Cloud Messaging (FCM) / Apple APNs.
