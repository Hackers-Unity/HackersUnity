# Hacker's Unity — Product Requirements Document (PRD)

> **Document Version:** 2.4.0  
> **Target Release:** Production 2026  
> **Product Name:** Hacker's Unity (HU Platform)  
> **Repository:** `hackers-unity`  
> **Status:** Active / In Development & Staging  

---

## 1. Executive Summary & Vision

**Hacker's Unity** is an all-in-one ecosystem and hackathon operating system built to bridge student technologists, developers, and designers with premier hackathons, tech sprints, bounties, and hiring challenges worldwide. 

Existing hackathon aggregation portals suffer from fragmented communication, clunky team formation, rigid registration workflows, and detached judging mechanisms. Hacker's Unity solves this by offering:
- A frictionless **7-Step Event Hosting Engine** with customizable questions, dynamic tracks, prize distribution, and submission schemas.
- High-performance **Squad Formation & Matchmaking** with invite tokens, automated email invitations, and skill matching.
- **Unified Organizer Dashboard** providing real-time applicant review, approval toggles, and CSV/spreadsheet exports.
- **Enterprise-Grade Real-Time Notification & News Engine** broadcasting platform announcements, deadlines, and live event updates via Supabase Realtime WebSockets.
- **Rich Competitive Identity** with hacker profiles, Elo ratings, global leaderboards, university rankings, and verified project portfolios.

---

## 2. Target Audience & Personas

### 2.1. The Student & Independent Builder (Hacker)
- **Profile:** College student (B.Tech, BCA, MCA, BS) or self-taught developer looking to showcase skills, build resume projects, win prizes, and land internships.
- **Pain Points:** Hard to find dedicated teammates matching required tech stacks (e.g., Solidity, ML/PyTorch, Next.js); missing application deadlines; lack of transparency in registration status.
- **Platform Needs:** Instant discovery, 1-click registration, squad invite links, real-time in-app and email notifications, project submission portal.

### 2.2. Event Organizers & College Chapters
- **Profile:** Student tech clubs (GDG, ACM, IEEE), collegiate hackathon directors, and corporate innovation teams.
- **Pain Points:** Managing Google Forms + Discord links is messy; screening thousands of applicants is manual; collecting submission links and repositories lacks standardized validation.
- **Platform Needs:** End-to-end 7-step wizard, custom form builder, applicant approval/waitlist workflow, branded event landing page with custom banners, participant CSV export, and submission tracking.

### 2.3. Platform Administrators & Community Leads
- **Profile:** Hacker's Unity core team and regional community managers.
- **Platform Needs:** Global announcement broadcast console, curated news publishing engine, event verification/featured badge toggles, and ecosystem analytics.

---

## 3. Key Feature Modules & Requirements

### 3.1. Authentication & Profile Management
- **Multi-Method Authentication:**
  - Email & Password with Supabase Auth (`signUp`, `signInWithPassword`).
  - Passwordless Email Magic Link & Phone SMS OTP (`signInWithOtp`).
  - OAuth Providers (GitHub & Google) for fast developer onboarding.
- **Adaptive Developer Profile:**
  - Dynamic Profession Selector: `STUDENT`, `PROFESSIONAL`, or `FREELANCER`.
  - Academic Details: Degree (`B.Tech`, `BCA`, `MCA`, etc.), Branch (`CSE`, `AI/DS`, `IT`, etc.), College/University, Graduation Year.
  - Professional Details: Company, Job Title, Years of Experience, Industry Domain.
  - Media: Profile Avatar & Banner image upload with client-side canvas cropping (`react-easy-crop`) stored in Supabase Storage (`hackathon-assets`).
  - Developer Footprint: GitHub, LinkedIn, Portfolio links, and tagging of core technical skills.
  - Public Profile Modal: Shareable view highlighting Elo score, won hackathons, bio, and badges.

### 3.2. Hackathon Discovery & Directory Engine
- **Search & Filtering:**
  - Hero instant search with debounced autocomplete and direct slug navigation.
  - Multi-parameter filters: Event Category (`HACKATHON`, `COMPETITION`, `WORKSHOP`, `HIRING_CHALLENGE`, `QUIZ`), Format (`ONLINE`, `OFFLINE`, `HYBRID`), Timeline status (`LIVE`, `REGISTRATION_OPEN`, `COMPLETED`), and Sort by (`newest`, `deadline`, `popular`, `prize`).
  - Dynamic View Modes: Responsive 3-column cards grid and streamlined list view.
  - Interactive Hackathon Cards: Live countdown timers ("X days left"), prize pool formatters, participant count tickers, mode badges, and bookmarking.

### 3.3. Hackathon Detail Experience (`/hackathons/[slug]`)
- **Branded Showcase:** Dynamic gradient hero banner, verified organizer badge, registration deadline pill, and prize pool highlight.
- **Tabbed Architecture:**
  - **Overview:** Tagline, rich HTML description, eligibility rules, difficulty level, and tags.
  - **Timeline / Stages:** Chronological milestone roadmap (Registration -> Hackathon Day -> Judging -> Awards).
  - **Submission Guidelines:** Required and optional deliverables (Repo link, Demo video, ZIP file, Slide deck).
  - **Prizes & Tracks:** Position awards (1st, 2nd, 3rd, Special Track prizes) with prize pools and sponsored bounties.
  - **Rules & Conduct:** Full guidelines and code of conduct.
  - **Sponsors & Partners:** Tiered sponsor grid (Title Partner, Host Partner, Ecosystem Partner).
  - **FAQs:** Accordion-based quick questions and answers.
- **Contextual Actions:** Solo registration, team squad creation, join via invite token, project submission modal, bookmark toggle, and social link sharing.

### 3.4. 7-Step Hackathon Hosting Engine (`/host`)
Comprehensive creation wizard supporting both new draft creation and editing existing events:
1. **Step 1 — Basic Info:** Event title, slug auto-generation, tagline, host organization name, host type (`COLLEGE`, `COMPANY`, `COMMUNITY`), category, format (`ONLINE`, `OFFLINE`, `HYBRID`), and venue picker (interactive address/city/venue search).
2. **Step 2 — Dates & Schedule:** Registration start and deadline, event start and end datetimes, timezone selector (defaults to `Asia/Kolkata`), with full validation ensuring chronological integrity.
3. **Step 3 — Details & Rules:** Rich text editor for detailed description, eligibility requirements, difficulty level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `OPEN`), tags, and code of conduct.
4. **Step 4 — Prizes & Tracks:** Total prize pool calculation, position-based prize rows, themed tracks with track-specific prizes, and sponsor cards with tiered badges.
5. **Step 5 — Registration Settings:** Capacity limit, pricing (`FREE` vs `PAID` with automated gateway inquiry email generator), approval mode (`AUTO` vs `MANUAL`), team limits (min/max members), default registration fields toggle, and dynamic Custom Question Builder (text, textarea, dropdown with options).
6. **Step 6 — Submission Requirements:** Toggle mandatory fields (Title, Description, GitHub repo) and optional fields (Demo video, ZIP file, Slide deck, Live demo URL).
7. **Step 7 — Review & Publish:** Live responsive preview of the Hackathon Card, validation checklist, and 1-click publishing to Supabase `events` table with real-time broadcast.

### 3.5. Squads & Team Matchmaking Engine (`/teammates` & Team Flow)
- **Squad Formation:** Team creation tied to specific hackathons, setting custom squad names and required roles (`AI/ML`, `Full-Stack`, `Smart Contract`, `Cloud`, `Robotics`).
- **Cryptographic Team Invites:**
  - Generation of 24-byte secure hex invite tokens (`gen_random_bytes(24)`).
  - Invite token routing: `/hackathons/[slug]/invite?token=[token]`.
  - Transactional Email Dispatch: Automated HTML emails sent via `/api/invite-email` utilizing Nodemailer / SMTP with personalized inviter names and hackathon branding.
  - In-App Accept / Decline flow with team member quota enforcement.
- **Hacker Matchmaking Arena (`/teammates`):**
  - Directory of builders open to squads (`openForTeams = true`).
  - Filter by domain and keyword search.
  - Direct invitation modal sending team pitch messages.

### 3.6. Project Submission Flow
- Standardized modal triggered during hackathon submission window.
- Captures Project Title, Tagline, Detailed Description, GitHub/GitLab Repository URL, Live Demo URL, Video Walkthrough URL, and Track selection.
- Validates URL formats and character minimums.
- Stored in `submissions` table with status progression: `SUBMITTED` -> `UNDER_REVIEW` -> `ACCEPTED` -> `WINNER` / `REJECTED`.

### 3.7. User Dashboard & Management (`/dashboard`)
- **Overview:** High-level metrics ticker (Active registrations, Organized events, Saved bookmarks, Team invites).
- **Participations Tab:** Cards for upcoming, ongoing, and completed hackathons with quick access to squad status and submission modal.
- **Organizing Tab:** List of events created by the logged-in user with live registration counts, status pills, edit shortcuts, and direct links to the Registrations Manager.
- **Registrations Manager (`/dashboard/events/[eventId]/registrations`):**
  - Real-time table of all applicants with search and status filtering (`ALL`, `PENDING`, `APPROVED`, `REJECTED`).
  - Action buttons to approve or reject pending participants.
  - 1-Click CSV / Spreadsheet download of applicant rosters with custom questionnaire answers.
- **Bookmarks Tab:** Quick-access grid to bookmarked hackathons.

### 3.8. Notifications & News Engine (`/news` & `/admin/notifications`)
- **Two-Tier Notification Architecture:**
  - `public.notifications`: Master notification records with type, message, icon, related event/news ID, and target scope (`all`, `specific_user`, `event_participants`, `team_members`).
  - `public.user_notifications`: Per-user inbox records with unread tracking (`is_read: boolean`).
- **Realtime Delivery:** Supabase Realtime WebSocket subscription pushes toasts and badges instantly to active users without page reload.
- **News Magazine (`/news` & `/news/[slug]`):**
  - Categories: `hackathons`, `technology`, `ai`, `competitions`, `internships`, `platform_updates`.
  - Rich article display with author metadata, read times, cover images, and social sharing.
- **Admin Broadcast Console (`/admin/notifications`):**
  - Instant platform-wide or targeted notification creation.
  - News article composer with optional automatic push notification broadcast to all users.
  - Broadcast history log with status and targeting details.

### 3.9. Competitive Leaderboard (`/leaderboard`)
- Dual tab rankings: **Top Builders** & **Top Collegiate Chapters**.
- Elo rating algorithm calculation based on hackathon participation, shortlisting, and podium finishes.
- Podium display for Rank 1 (Global Champion), Rank 2, and Rank 3 with trophies, win counters, and university tags.

---

## 4. Non-Functional Requirements

### 4.1. Performance & Core Web Vitals
- **LCP (Largest Contentful Paint):** < 1.8s on 4G connections.
- **INP (Interaction to Next Paint):** < 150ms for modal opens and filter interactions.
- **CLS (Cumulative Layout Shift):** < 0.05 via explicit image dimension reservations and skeleton states.

### 4.2. Availability & Resilience (Dual-Tier Fallback)
- The web frontend implements a hybrid architecture:
  - Primary: Direct querying to Supabase PostgreSQL database.
  - Fallback: Transparent degradation to local storage (`localStorage`) and rich mock datasets (`mock-data.ts`) if Supabase connection credentials are temporarily missing or network is disconnected, preventing application crash.

### 4.3. Security & Compliance
- Supabase Row Level Security (RLS) on all 8 tables (`profiles`, `events`, `registrations`, `teams`, `team_members`, `team_invitations`, `submissions`, `notifications`, `user_notifications`, `news`).
- Secure cryptographic generation for team invite tokens.
- Secure environment variable isolation separating `NEXT_PUBLIC_` client tokens from server-only secrets (`SUPABASE_SECRET_KEY`, SMTP credentials).

---

## 5. Success Metrics & KPIs
1. **User Activation:** > 70% of registered accounts complete their developer profile.
2. **Team Formation Rate:** > 65% of team-event registrants successfully form or join a squad before the deadline.
3. **Host Completion Rate:** > 80% of organizers who begin Step 1 complete Step 7 and publish their event.
4. **Platform Notification Engagement:** > 40% open/click-through rate on transactional team invite and deadline reminder notifications.
