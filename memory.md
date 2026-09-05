# Hacker's Unity — Project Memory & Knowledge Base

> **Document Type:** Living Developer & AI Agent Context Repository  
> **Repository:** `hackers-unity`  
> **Last Updated:** 2026-08-31  

---

## 1. Project Identity & Monorepo Topology

**Hacker's Unity** is an open-innovation hackathon platform and competitive ecosystem for student developers and technical organizers.

### Workspace Mapping
- **Monorepo Root:** `/Users/chinmaybhatt/hackers-unity`
- **Frontend Application (`@hackers-unity/web`):** `apps/web` (Next.js 16.3.1, React 19.2.8, TailwindCSS v4)
- **Backend Service (`api`):** `apps/api` (NestJS 11.0.1, Express, Jest)
- **Shared Contracts (`@hackers-unity/shared-types`):** `packages/shared-types`
- **Database Engine:** PostgreSQL 16 on Supabase (`apps/web/supabase/`)
- **Container Infrastructure:** `docker-compose.yml` (Postgres 16, Redis 7, Meilisearch 1.12)

---

## 2. Architecture Decisions Log (ADRs)

### ADR-001: Next.js 16 App Router with React 19 & Turborepo
- **Decision:** Build client apps on Next.js 16 with React 19 and Turborepo for fast caching.
- **Context:** Requires `use(params)` for route parameters because `params` and `searchParams` are Promises in Next.js 16.
- **Status:** Adopted.

### ADR-002: Dual-Tier Fallback Storage Engine
- **Decision:** All database queries in `lib/supabase-service.ts` are backed by transparent client-side fallbacks in `lib/storage.ts` and `lib/mock-data.ts`.
- **Rationale:** Ensures zero downtime during local development, demo presentations, or network failures. When Supabase is connected, data syncs seamlessly in the background. Cross-tab reactivity is powered by `hackers_unity_storage_change` custom window events.
- **Status:** Adopted.

### ADR-003: 7-Step Modular Event Hosting Architecture
- **Decision:** Event creation and editing in `/host` is partitioned into 7 sequential steps with persistent state, real-time validation, dynamic questionnaire builders, and live card preview before publishing.
- **Status:** Adopted.

### ADR-004: Two-Tier Realtime Notification System
- **Decision:** Segregate notification generation into `public.notifications` (event/news master) and `public.user_notifications` (per-user inbox). Listen to user inboxes using Supabase Realtime WebSockets for instant toast dispatch.
- **Status:** Adopted.

### ADR-005: Cryptographic 24-Byte Hex Squad Invite Tokens
- **Decision:** Squad invitation links use cryptographically secure 24-byte hex tokens (`gen_random_bytes(24)`). Email invitations contain deep links (`/hackathons/[slug]/invite?token=[token]`), processed by `/api/invite-email`.
- **Status:** Adopted.

### ADR-006: Client-Side Canvas Cropping for Image Uploads
- **Decision:** Avatars and banners are cropped in the browser using `react-easy-crop` and HTML5 canvas before uploading to the Supabase `hackathon-assets` storage bucket.
- **Rationale:** Minimizes bandwidth usage, standardizes image aspect ratios (1:1 for avatars, 16:9 for banners), and eliminates server-side image processing bottlenecks.
- **Status:** Adopted.

---

## 3. Environment Variables Reference

### Frontend (`apps/web/.env.local` or `.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://qbidqpbtivgmsxlitbxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase Server Service Role Key | Required for server route handlers |
| `NEXT_PUBLIC_APP_URL` | Base application URL | `http://localhost:3000` |
| `SMTP_HOST` | Transactional email SMTP host | e.g., `smtp.resend.com` or `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` or `465` |
| `SMTP_USER` | SMTP username | Account email |
| `SMTP_PASS` | SMTP application password | App password |
| `SMTP_FROM` | Outgoing email sender | `Hacker's Unity <notifications@hackersunity.dev>` |

---

## 4. Key Route & Feature Map

| Route | Purpose | Key Components / Services |
| :--- | :--- | :--- |
| `/` | Landing page | `<HeroSearch />`, `<HackathonCard />`, partner banner |
| `/events` | All events directory | Search, category & format filters, grid/list toggle |
| `/hackathons/[slug]` | Event details & registration hub | Tabbed details, squad status, `<ProjectSubmissionModal />` |
| `/hackathons/[slug]/register` | Solo & team registration | 3-step registration, custom questions, team creation |
| `/hackathons/[slug]/invite` | Accept / decline team invite | Token validation, squad member join |
| `/host` | 7-step Hackathon Host Wizard | `<VenuePicker />`, `<RichTextEditor />`, preview card |
| `/dashboard` | User dashboard & organizer portal | Overview, participations, hosted events, bookmarks |
| `/dashboard/events/[id]/registrations` | Organizer Applicant Manager | Status toggles (Approve/Reject), CSV export |
| `/teammates` | Hacker Matchmaking Arena | Hacker directory, role filters, invite modal |
| `/leaderboard` | Global & College Leaderboard | Top builders, college chapters, Elo ratings |
| `/news` | Platform News Magazine | News categories, featured article, social sharing |
| `/admin/notifications` | Admin Broadcast Console | Push notification broadcaster, news publisher |
| `/settings` | Profile & Account Settings | Avatar & banner cropping, academic & work info |
| `/brand-guidelines` | Official Brand Standards | Approved variants, color palette, typography rules |

---

## 5. Critical Gotchas & Coding Rules for Agents

1. **Next.js 16 Route Params:**
   - In dynamic route files (`[slug]`, `[eventId]`), `params` is a Promise.
   - Always resolve with `const resolvedParams = use(params);` in client components or `const { slug } = await params;` in server components.
2. **`useSearchParams()` Boundary:**
   - Always wrap components that call `useSearchParams()` inside `<Suspense>` to prevent client de-opt.
3. **TailwindCSS v4 Architecture:**
   - The workspace uses `@tailwindcss/postcss` and `@import "tailwindcss";` in `globals.css`.
   - Theme variables are configured via `@theme inline`. There is no legacy `tailwind.config.js`.
4. **Email Invite Fallback:**
   - If SMTP credentials are not configured, `/api/invite-email` safely outputs the generated invite URL to the server console rather than throwing a fatal error.
5. **Database Triggers:**
   - Never update `events.registration_count` manually in client code; it is atomically incremented/decremented via PostgreSQL trigger `trigger_update_registration_count` on `public.registrations`.
6. **Cross-Tab Syncing:**
   - If updating local fallback state in `lib/storage.ts`, always invoke:
     ```ts
     window.dispatchEvent(new Event('hackers_unity_storage_change'));
     ```
