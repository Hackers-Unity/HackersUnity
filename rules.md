# Hacker's Unity — Engineering Rules & Code Standards

> **Document Version:** 2.4.0  
> **Applies to:** Entire Monorepo (`apps/web`, `apps/api`, `packages/shared-types`)  
> **Enforcement:** Mandatory for all AI agents, contributors, and core developers  

---

## 1. Core Engineering Principles

1. **Type Safety Across Monorepo Boundaries:** All domain entities, DTOs, and API responses must originate from `packages/shared-types`. Never re-declare ad-hoc types in frontend components or backend controllers.
2. **Dual-Tier Resilience:** Every data mutation and query in the web app should be designed to degrade gracefully. If Supabase is unreachable or missing environment variables in local dev, the app must fall back to `lib/storage.ts` without throwing unhandled exceptions or crashing the UI.
3. **No Silent Failures:** Always wrap asynchronous database and network calls in structured try/catch blocks. Surface human-readable error messages via toasts or form validation states.
4. **Explicit Client/Server Boundaries:** In Next.js 16, be deliberate with `'use client'`. Keep leaf components client-side while keeping layouts, static wrappers, and metadata server-side whenever feasible.

---

## 2. Next.js 16 & React 19 Specific Conventions

### 2.1. Dynamic Route Parameters (`params` are Promises)
In Next.js 16, route parameters (`params`) and search parameters (`searchParams`) are asynchronous Promises. You **MUST** resolve them using React 19 `use()` in Client Components or `await` in Server Components:

```tsx
// ✅ CORRECT (Client Component in Next.js 16)
'use client';
import { use } from 'react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  // ...
}
```

```tsx
// ❌ INCORRECT (Will trigger runtime warning/error in Next.js 16)
export default function EventPage({ params }: { params: { slug: string } }) {
  const slug = params.slug; // ERROR: params is a Promise!
}
```

### 2.2. Suspense Wrapping for `useSearchParams`
Any client component calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary to prevent de-opting the entire page into client-side CSR:

```tsx
<Suspense fallback={<LoadingSpinner />}>
  <HostWizardComponent />
</Suspense>
```

---

## 3. TypeScript & Data Contract Rules

1. **Strict Type Checking:** `noImplicitAny: true` is strictly enforced. Avoid using `any`. Use `unknown` with type narrowing or define explicit interfaces.
2. **DTO & Enum Canonical Source:**
   - User Roles: `UserRole` (`PARTICIPANT`, `ORGANIZER`, `ADMIN`, `SUPER_ADMIN`).
   - Event Statuses: `EventStatus` (`DRAFT`, `PUBLISHED`, `REGISTRATION_CLOSED`, `ONGOING`, `COMPLETED`, `ARCHIVED`).
   - Event Formats: `EventType` (`ONLINE`, `OFFLINE`, `HYBRID`).
   - Notification Types: `NotificationDbType` & `NotificationTargetType`.
3. **Response Envelopes:** Standard API responses should conform to `ApiResponse<T>` or `PaginatedResponse<T>` from `packages/shared-types`.

---

## 4. Styling & TailwindCSS v4 Conventions

1. **Brand Color Fidelity:** Never invent arbitrary hex codes. Always use the designated brand tokens:
   - Sky Blue: `#00A6DA` / `#0099e6`
   - Signal Orange: `#FF8500` / `#f97316` / `#ea580c`
   - Brand Black: `#000000` / `#0f172a`
   - Cream: `#EEE5D4` / `#f5f0e8`
   - White: `#FFFFFF`
2. **Tailwind v4 Theme Tokens:** Reference CSS variables via `@theme inline` defined in `apps/web/app/globals.css`.
3. **Mobile-First Layouts:** Design for 375px screens first. Use `sm:`, `md:`, `lg:`, `xl:` responsive prefixes progressively.
4. **No Inline Heavy Styles:** All glassmorphism, gradients, and custom scrollbars must use utility classes (`.glass-panel`, `.glass-panel-hover`, `.text-gradient-brand`, `.bg-grid-pattern`).

---

## 5. Supabase & PostgreSQL Best Practices

1. **Idempotent SQL Scripts:** All migrations must be idempotent:
   ```sql
   CREATE TABLE IF NOT EXISTS public.teams (...);
   ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tagline TEXT;
   DROP POLICY IF EXISTS "Public can view published events" ON public.events;
   CREATE POLICY "Public can view published events" ON public.events ...;
   CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events (slug);
   ```
2. **Mandatory Row Level Security (RLS):** Every single table created in the `public` schema **MUST** have RLS enabled:
   ```sql
   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
   ```
3. **Optimized Indexes:** Ensure foreign keys and lookup columns (`slug`, `event_id`, `user_id`, `leader_id`, `status`) have dedicated B-Tree indexes.
4. **Security Definer Functions:** When writing PL/pgSQL functions that bypass RLS (e.g., triggers that update registration counts), declare `SECURITY DEFINER` and specify explicit search paths to prevent search-path injection.
5. **No Direct Secret Exposure:** Never put `SUPABASE_SECRET_KEY` or `SERVICE_ROLE_KEY` in files bundled to the client. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are allowed on the frontend.

---

## 6. State Management & Dual-Storage Rules

1. **Synchronous Broadcast Pattern:** When updating local cached state in `lib/storage.ts`, always dispatch the cross-tab event:
   ```ts
   window.dispatchEvent(new Event('hackers_unity_storage_change'));
   ```
2. **Background Supabase Sync:** If a user is authenticated, local cache mutations must trigger a background sync with Supabase:
   ```ts
   if (userId) {
     toggleBookmarkInSupabase(userId, eventId).catch(console.error);
   }
   ```
3. **Session Hydration:** The `AuthProvider` must initialize immediately from local storage (`getStoredUser()`) to avoid layout flashing while Supabase session validation runs asynchronously in the background.

---

## 7. Monorepo & Git Workflow Rules

1. **Commit Message Standard:** Follow Conventional Commits:
   - `feat(web): add CSV export to event registrations`
   - `fix(host): resolve timezone validation in step 2`
   - `refactor(types): consolidate notification target enums`
   - `docs: update architecture and PRD documentation`
2. **Zero Breaking Changes Across Packages:** When modifying `packages/shared-types`, verify that both `apps/web` and `apps/api` compile cleanly by running:
   ```bash
   pnpm turbo typecheck
   pnpm turbo build
   ```
3. **Environment Separation:**
   - `.env.local` for `apps/web` local secrets.
   - `.env` for `apps/api` local configuration.
   - Never commit actual API keys, database passwords, or private SMTP tokens to Git.
