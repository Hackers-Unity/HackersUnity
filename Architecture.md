# Hacker's Unity — System Architecture & Technical Specifications

> **Document Version:** 2.4.0  
> **Target Release:** Production 2026  
> **Repository:** `hackers-unity`  
> **Status:** Active / Monorepo Architecture  

---

## 1. Monorepo Architecture & Workspace Layout

The platform is engineered as a high-performance **Turborepo** monorepo managed via **pnpm workspaces** (`pnpm@9.15.0`). It decouples client-facing applications, backend microservices, and shared data contracts into modular packages.

```
hackers-unity/
├── apps/
│   ├── web/                     # Next.js 16.3.1 (React 19, TailwindCSS v4, App Router)
│   │   ├── app/                 # App Router pages, layouts, and route handlers
│   │   │   ├── admin/           # Platform administration & notification broadcaster
│   │   │   ├── api/             # Next.js Server Route Handlers (events, invite-email, registrations)
│   │   │   ├── auth/            # Auth callback & verification routes
│   │   │   ├── dashboard/       # User dashboard, organizing portal & registration manager
│   │   │   ├── events/          # Universal events & workshops directory
│   │   │   ├── hackathons/      # Hackathon details, squad invite & registration flow
│   │   │   ├── host/            # 7-step Hackathon creation wizard & edit mode
│   │   │   ├── leaderboard/     # Global Elo & University rankings
│   │   │   ├── news/            # Platform news magazine & editorial system
│   │   │   ├── settings/        # Hacker profile, education, professional & security settings
│   │   │   ├── teammates/       # Builder matchmaking arena & squad formation
│   │   │   └── page.tsx         # High-conversion landing page
│   │   ├── components/          # Reusable UI component library (modals, cards, editors)
│   │   ├── lib/                 # Core services, auth context, storage engine, hooks
│   │   ├── supabase/            # PostgreSQL database schemas & incremental migrations (v1 - v3)
│   │   └── utils/               # Supabase SSR client, server, and middleware utilities
│   │
│   └── api/                     # NestJS 11.0.1 Backend Microservice (TypeScript, Express)
│       ├── src/                 # Controllers, Modules, Services, and Guards
│       └── test/                # Unit & E2E Jest test suites
│
├── packages/
│   └── shared-types/            # Canonical TypeScript interfaces, enums, and DTOs
│       └── src/
│           ├── auth.ts          # Auth tokens, user roles, login/register DTOs
│           ├── user.ts          # UserPublic, OrganizerProfile, profession metadata
│           ├── event.ts         # EventPublic, EventStage, EventFaq, Prize, DTOs
│           ├── registration.ts  # Registration, custom answers, status enums
│           ├── team.ts          # Team, TeamMember, squad statuses & invite DTOs
│           ├── notification.ts  # Notifications, UserNotifications, NewsArticle, DTOs
│           └── index.ts         # Central exports and common ApiResponse<T>
│
├── docker-compose.yml           # Local dev infrastructure (Postgres 16, Redis 7, Meilisearch 1.12)
├── pnpm-workspace.yaml          # Monorepo package workspace definitions
├── turbo.json                   # Build pipeline task caching & execution graph
└── package.json                 # Monorepo scripts & dependencies
```

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Clients & Edge Tier"]
        Browser["Modern Browser (Desktop / Mobile)"]
        NextEdge["Next.js 16 Edge / Server Runtime"]
    end

    subgraph AppWeb["apps/web (Next.js 16 + React 19)"]
        Pages["App Router Pages & Server Components"]
        ClientComp["Client Components & State Contexts"]
        RouteHandlers["Next.js Route Handlers (/api/*)"]
        StorageEngine["Dual-Tier Storage (Supabase + LocalStorage Fallback)"]
    end

    subgraph AppApi["apps/api (NestJS 11 Microservice)"]
        NestControllers["REST Controllers"]
        NestServices["Domain Business Logic"]
        NestGuards["Auth & Role Guards"]
    end

    subgraph SupabaseServices["Supabase Cloud / PostgreSQL 16 Infrastructure"]
        SupaAuth["Supabase GoTrue Auth (OAuth, Email, Phone OTP)"]
        SupaDB["PostgreSQL Database (RLS, Triggers, Functions)"]
        SupaRealtime["Supabase Realtime (WebSockets Engine)"]
        SupaStorage["Supabase Storage ('hackathon-assets' Bucket)"]
    end

    subgraph ExternalServices["External Integrations"]
        SMTP["Transactional SMTP / Nodemailer"]
        OAuthProviders["GitHub & Google OAuth"]
    end

    Browser <-->|HTTP / React SSR| NextEdge
    NextEdge <--> Pages
    ClientComp <--> ClientComp
    ClientComp <-->|Direct Client Queries| SupaDB
    ClientComp <-->|Realtime Pub/Sub| SupaRealtime
    ClientComp <-->|Auth Sessions & Cookies| SupaAuth
    ClientComp <-->|Binary Image Uploads| SupaStorage
    ClientComp <-->|API Calls| RouteHandlers
    ClientComp <-->|Optional Extended API| NestControllers

    RouteHandlers <-->|Service Role Client| SupaDB
    RouteHandlers <-->|Dispatch Invites| SMTP
    SupaAuth <-->|Federated Login| OAuthProviders
    NestServices <-->|Database Queries| SupaDB
```

---

## 3. Database Schema & Entity Relationship Model

The database is built on **PostgreSQL 16** within Supabase, featuring strict relational integrity, UUID primary keys (`uuid-ossp` / `gen_random_uuid()`), JSONB flexibility for dynamic content, performance indexes, and database-level triggers.

```mermaid
erDiagram
    PROFILES ||--o{ EVENTS : organizes
    PROFILES ||--o{ REGISTRATIONS : registers
    PROFILES ||--o{ BOOKMARKS : saves
    PROFILES ||--o{ TEAMS : leads
    PROFILES ||--o{ TEAM_MEMBERS : joins
    PROFILES ||--o{ TEAM_INVITATIONS : sends
    PROFILES ||--o{ SUBMISSIONS : submits
    PROFILES ||--o{ USER_NOTIFICATIONS : receives
    PROFILES ||--o{ NEWS : authors

    EVENTS ||--o{ REGISTRATIONS : has
    EVENTS ||--o{ BOOKMARKS : bookmarked_by
    EVENTS ||--o{ TEAMS : hosts
    EVENTS ||--o{ TEAM_INVITATIONS : associated_with
    EVENTS ||--o{ SUBMISSIONS : receives
    EVENTS ||--o{ NOTIFICATIONS : triggers

    TEAMS ||--o{ TEAM_MEMBERS : contains
    TEAMS ||--o{ TEAM_INVITATIONS : issues
    TEAMS ||--o{ SUBMISSIONS : submits_as

    NOTIFICATIONS ||--o{ USER_NOTIFICATIONS : delivers_to
    NEWS ||--o{ NOTIFICATIONS : references

    PROFILES {
        uuid id PK
        text email UK
        text name
        text role
        text college
        text organization
        text bio
        text_array skills
        text avatar_url
        text banner_url
        integer elo_score
        text github_url
        text linkedin_url
        text portfolio_url
        text profession_type
        text degree
        text branch
        text company
        text job_title
        text experience_years
        text industry
        timestamptz created_at
        timestamptz updated_at
    }

    EVENTS {
        uuid id PK
        text slug UK
        text title
        text tagline
        text description
        text short_description
        text category
        text event_type
        text location
        uuid organizer_id FK
        text organizer_name
        text organizer_avatar
        text logo_url
        text banner_url
        timestamptz registration_start
        timestamptz registration_deadline
        timestamptz start_date
        timestamptz end_date
        text timezone
        numeric total_prize_value
        jsonb prizes
        jsonb tracks
        jsonb stages
        jsonb faqs
        jsonb sponsors
        text_array tags
        integer min_team_size
        integer max_team_size
        boolean is_team_event
        boolean featured
        integer participants_count
        integer registration_count
        text status
        text difficulty
        text rules_text
        text registration_type
        integer registration_capacity
        text approval_mode
        jsonb custom_questions
        timestamptz created_at
        timestamptz updated_at
    }

    REGISTRATIONS {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        text user_name
        text user_email
        text phone
        text college
        text city
        text github_url
        text linkedin_url
        text_array skills
        boolean is_team
        text team_name
        text role
        text status
        jsonb custom_answers
        timestamptz registered_at
    }

    TEAMS {
        uuid id PK
        text name
        uuid event_id FK
        uuid leader_id FK
        text_array looking_for
        text description
        integer max_members
        timestamptz created_at
    }

    TEAM_MEMBERS {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text role
        text status
        timestamptz joined_at
    }

    TEAM_INVITATIONS {
        uuid id PK
        uuid team_id FK
        uuid event_id FK
        uuid invited_by FK
        text invited_email
        text status
        text invite_token UK
        timestamptz created_at
        timestamptz responded_at
    }

    SUBMISSIONS {
        uuid id PK
        uuid event_id FK
        uuid team_id FK
        uuid submitter_id FK
        text project_name
        text tagline
        text description
        text repo_url
        text demo_url
        text video_url
        text track
        numeric score
        text status
        timestamptz created_at
    }

    NOTIFICATIONS {
        uuid id PK
        text title
        text message
        text type
        text icon
        uuid event_id FK
        uuid sender_id FK
        uuid news_id FK
        text target_type
        text action_url
        jsonb metadata
        timestamptz created_at
    }

    USER_NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid notification_id FK
        boolean is_read
        timestamptz created_at
    }

    NEWS {
        uuid id PK
        text title
        text slug UK
        text description
        text content
        text cover_image
        text category
        uuid author_id FK
        text status
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 4. Key Database Functions & Automated Triggers

### 4.1. Real-Time Registration Counter (`update_registration_count`)
Maintains an atomic counter of registered hackers per event without slow runtime `COUNT(*)` aggregations:
```sql
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
```

### 4.2. Auto-Slug Generation Engine (`generate_unique_slug`)
Automatically creates URL-friendly slugs for hackathons and news articles while collision-checking and auto-incrementing:
```sql
CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(TRIM(base_title));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
  IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'event'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Authentication & Session Architecture

Authentication is powered by **Supabase Auth (GoTrue)** integrated with Next.js SSR via `@supabase/ssr`:

1. **Client-Side Auth Context (`apps/web/lib/auth-context.tsx`):**
   - Maintains `user: UserPublic | null`, `supabaseUser: SupabaseUser | null`, `session: Session | null`, and `loading: boolean`.
   - Listens to `supabase.auth.onAuthStateChange` to reactively update session tokens.
   - Synchronizes user metadata into the `profiles` table upon sign-up or profile update.
2. **SSR Middleware (`apps/web/middleware.ts` & `utils/supabase/middleware.ts`):**
   - Refreshes auth cookies on every inbound HTTP request via `createServerClient`.
   - Manages token lifecycles safely across Edge and Server Components.
3. **Multi-Factor / Multi-Method Providers:**
   - Email/Password with verification confirmation flow.
   - Passwordless Phone SMS OTP via `signInWithPhone` & `verifyPhoneOtp`.
   - OAuth redirect handling via `/auth/callback` code exchange.

---

## 6. Real-Time WebSocket Infrastructure

To support high-velocity hackathons, Hacker's Unity utilizes **Supabase Realtime WebSockets**:
- **Events Channel (`public.events`):**
  - Table is published to `supabase_realtime`.
  - When an organizer launches a hackathon in `/host`, clients listening to `subscribeToPublishedEvents` receive the `INSERT` or `UPDATE` payload instantly, updating directory feeds without a manual refresh.
- **Notification Toast Engine (`public.user_notifications`):**
  - Realtime publication enables instant delivery of `user_notifications`.
  - When an admin sends a broadcast or a team leader invites a user, a new record in `user_notifications` immediately activates `<NotificationToast />` and increments the bell badge in `<Navbar />`.

---

## 7. Next.js Server Route Handlers

### 7.1. `/api/events` (POST)
- Handles server-side hackathon persistence using `createClient` with administrative privileges.
- Validates dates, generates slugs, maps JSON fields, and broadcasts changes.

### 7.2. `/api/invite-email` (POST)
- Dispatches responsive HTML team invitations via Nodemailer.
- Generates deep links (`/hackathons/[slug]/invite?token=[token]`).
- Includes fallback direct console preview when SMTP credentials are not yet configured in `.env`.

### 7.3. `/api/registrations` (POST)
- Manages solo and team event registrations.
- Resolves event slugs to UUIDs.
- Auto-creates or updates hacker profiles in `public.profiles` if missing.
- Prevents duplicate registrations via unique database constraints.

---

## 8. Dual-Tier Storage & Offline Resilience

To guarantee 100% development uptime and prevent interface breakage during database configuration, the platform implements a dual-tier persistence pattern:
1. **Tier 1 (Cloud):** Supabase PostgreSQL via `supabase-service.ts` and `@supabase/supabase-js`.
2. **Tier 2 (Client Cache & Fallback):** `lib/storage.ts` provides structured `localStorage` persistence and cross-tab event synchronization via `window.dispatchEvent(new Event('hackers_unity_storage_change'))`.
3. **Seed Data:** `lib/mock-data.ts` contains battle-tested mock events (`CodeWars`, `Clash Of Coders`, `ChatGPT Codex`, etc.), leaderboard champions, and mock news articles.

---

## 9. Storage & Asset Pipeline

- **Supabase Storage Bucket:** `hackathon-assets` (configured with public read access).
- **Client-Side Image Manipulation:**
  - `AvatarUpload` (`components/avatar-upload.tsx`) and `BannerUpload` (`components/banner-upload.tsx`) use `react-easy-crop` to provide interactive panning, zooming, and aspect ratio locking (1:1 for avatars, 16:9 or 3:1 for banners).
  - Canvas utilities (`lib/crop-utils.ts`) crop the image in the browser and output clean JPEG/WebP blobs.
  - Uploaded directly to `storage.from('hackathon-assets').upload(...)` with timestamped sanitized filenames.
