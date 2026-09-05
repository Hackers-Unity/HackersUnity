# Hacker's Unity — Design System & UI/UX Specifications

> **Document Version:** 2.4.0  
> **Brand Authority:** Official Hacker's Unity Brand Guidelines  
> **Design Philosophy:** Premium High-Energy Developer Aesthetics (Glassmorphism, Light Modernity, Curated Palette)  
> **Target Framework:** TailwindCSS v4 with `@theme inline`  

---

## 1. Brand Identity & Design Principles

The design of **Hacker's Unity** balances high-performance developer efficiency with a stunning, high-energy competitive aesthetic. It avoids generic flat colors or cookie-cutter templates, using tailored gradients, subtle ambient lighting, glassmorphic card elevations, and tactile micro-animations.

### 1.1. Core Brand Rules (From Brand Guidelines)
1. **Vertical Lockup Standard:** The Hacker's Unity mark and wordmark appear together as a vertical lockup with consistent spacing.
2. **Strict Clearspace:** A minimum clearspace of **5–6px** (at small scale) is maintained around all edges of the logo mark. No typography, icons, or borders may intrude into this zone.
3. **Approved Variants:**
   - **Black Mark:** Exclusively on light backgrounds (`#FFFFFF`, `#F8FAFC`, `#EEE5D4`).
   - **White/Cream Mark:** Exclusively on dark surfaces (`#000000`, `#0F172A`, `#111111`).
4. **No Modification:** The mark is never stretched, distorted, rotated, bordered, or placed in unauthorized colors. Scale proportionally only.

---

## 2. Color Palette System

Hacker's Unity utilizes a strictly calibrated 5-tone brand palette supported by slate neutral shades for interface depth:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CORE BRAND COLOR PALETTE                          │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│    Black    │  Sky Blue   │Signal Orange│    Cream    │     White      │
│   #000000   │   #00A6DA   │   #FF8500   │   #EEE5D4   │    #FFFFFF     │
│ RGB 0,0,0   │RGB 0,168,218│RGB 255,133,0│RGB238,229,212│ RGB 255,255,255│
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

### 2.1. Primary Brand Tokens
- **Brand Black (`#000000` / `#0f172a`):** Core identity color. Used for primary typography, dark modals, and main navigation contrasts.
- **Sky Blue (`#00A6DA` / `#0099e6`):** Dedicated to the "Hacker's" portion of the wordmark, primary interactive buttons, tech tags, and focused states. Hover variant: `#0284c7`.
- **Signal Orange (`#FF8500` / `#f97316`):** Dedicated to the "Unity" portion of the wordmark, prize pools, live status pings, urgency pills, and primary CTAs. Hover variant: `#ea580c`.
- **Cream (`#EEE5D4` / `#f5f0e8`):** Organic neutral tone used for paper-like card elevations and high-contrast editorial backings.
- **Pure White (`#FFFFFF`):** Base canvas and clean card surfaces.

### 2.2. Interface Neutral Gradients & Accents
- **Background:** `#f8fafc` (Soft off-white with radial ambient mesh).
- **Border Subtlety:** `#e2e8f0` (Light borders) and `rgba(226, 232, 240, 0.8)` for translucent glass cards.
- **Muted Text:** `#64748b` (Slate-500) and `#475569` (Slate-600).
- **High-Contrast Text:** `#0f172a` (Slate-900).

### 2.3. Brand Gradients
```css
/* Wordmark & Highlight Gradient */
.text-gradient-brand {
  background: linear-gradient(135deg, #0099e6 0%, #0284c7 50%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Blue Accent Gradient */
.text-gradient-blue {
  background: linear-gradient(135deg, #0099e6 0%, #0369a1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Orange Accent Gradient */
.text-gradient-orange {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 3. Typography Hierarchy

The platform uses modern, geometric sans-serif typography paired with monospaced accents for developer data.

- **Primary Sans:** `Geist Sans` (via `next/font`), falling back to `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Developer Mono:** `Geist Mono`, falling back to `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.

### Typography Scale
| Element | Font | Size | Weight | Tracking / Leading |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Sans | `3.75rem` - `4.5rem` (60-72px) | Black (900) | `tracking-tight leading-[1.08]` |
| **Page Title (H1)** | Sans | `2.25rem` - `3rem` (36-48px) | Black (900) | `tracking-tight leading-tight` |
| **Section Header (H2)** | Sans | `1.5rem` - `1.875rem` (24-30px) | Bold (700) | `tracking-tight` |
| **Card Title (H3)** | Sans | `1.125rem` - `1.25rem` (18-20px) | Bold (700) | `leading-snug` |
| **Body Primary** | Sans | `0.9375rem` - `1rem` (15-16px) | Normal (400) / Medium (500) | `leading-relaxed` |
| **Small / Meta** | Sans | `0.75rem` - `0.8125rem` (12-13px) | Medium (500) / Semibold (600) | `leading-normal` |
| **Pill / Label / Tag** | Mono / Sans | `0.6875rem` - `0.75rem` (11-12px) | Bold (700) / Black (900) | `uppercase tracking-wider` |
| **Data / Numbers** | Mono | `0.875rem` - `1.5rem` (14-24px) | Bold (700) / Black (900) | `font-mono tracking-tight` |

---

## 4. UI Surface Patterns & Glassmorphism

### 4.1. Ambient Canvas Background
Instead of flat gray, the page background uses subtle fixed radial gradients:
```css
body {
  background-color: #f8fafc;
  background-image: 
    radial-gradient(at 0% 0%, rgba(0, 153, 230, 0.07) 0px, transparent 45%),
    radial-gradient(at 100% 0%, rgba(249, 115, 22, 0.06) 0px, transparent 45%),
    radial-gradient(at 50% 100%, rgba(2, 132, 199, 0.05) 0px, transparent 45%);
  background-attachment: fixed;
}
```

### 4.2. Glass Panel Surface
```css
.glass-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
}

.glass-panel-hover {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-panel-hover:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(0, 153, 230, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -8px rgba(0, 153, 230, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.05);
}
```

### 4.3. Geometric Grid Pattern
```css
.bg-grid-pattern {
  background-size: 32px 32px;
  background-image: 
    linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
}
```

---

## 5. Core Component Design Specifications

### 5.1. `<HackathonCard />`
- **Banner Gradient Header:** Dynamically themed or custom uploaded banner with smooth vignette.
- **Status Indicator:** Floating badge with pulsing status dot (Green for `LIVE`, Orange for `UPCOMING`, Slate for `COMPLETED`).
- **Prize Pool Badge:** High-contrast pill highlighting formatted currency (`$30,000` / `₹50,000`).
- **Countdown Pill:** Clock icon with calculated remaining days (`3 days left`).
- **Tag Row:** Skill and domain chips (`AI/ML`, `Web3`, `Full-Stack`) with horizontal wrap and overflow protection.
- **Footer Interaction:** Bookmark toggle with heart/bookmark animation + "Explore Hackathon" arrow button with hover translation.

### 5.2. `<Navbar />`
- **Header Structure:** Sticky, translucent blur (`backdrop-blur-md bg-white/85 border-b border-slate-200/80`).
- **Brand Lockup:** Vector lightning logo + bold italic two-color wordmark.
- **Search Trigger (`Cmd+K`):** Pill input with search icon, opening the modal `<SearchDialog />`.
- **Navigation Links:** Active route indicator with subtle colored background pills.
- **Notification Center:** Dynamic bell button with unread count badge triggering `<NotificationPanel />`.
- **Auth Button / User Menu:** Avatar dropdown showcasing hacker name, Elo score, quick links, and sign-out.

### 5.3. `<HeroSearch />`
- **Search Box:** Large, elevated input with search icon, instant clear button, and category shortcuts (`All`, `Hackathons`, `Bounties`, `Webinars`).
- **Live Autocomplete Dropdown:** Debounced search results showcasing matching event titles, prize pools, and direct navigation links.

### 5.4. `<VenuePicker />`
- Dedicated to offline and hybrid hackathons in `/host`.
- Provides an intuitive search input for cities, campuses, and convention centers with auto-populated address, landmark, and city tags.

### 5.5. `<RichTextEditor />`
- Clean WYSIWYG editor for hackathon descriptions, rules, and news stories.
- Toolbar controls: Headings (H2, H3), Bold, Italic, Bullet Lists, Numbered Lists, Code blocks, Quotes, and Link Insertion.
- Produces clean, sanitized HTML stored in Supabase `events.description` and `news.content`.

### 5.6. `<AvatarUpload />` & `<BannerUpload />`
- Interactive cropping modal with modal backdrop blur.
- Panning and zooming controls with slider and mouse-wheel support.
- Aspect ratio lock: `1:1` for profile avatars, `16:9` or custom aspect for hackathon event banners.

---

## 6. Micro-Interactions & Animation Guidelines

- **Hover Transitions:** Standard duration `200ms` - `250ms` using `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Button Feedback:** Subtle scale down on click (`active:scale-[0.98]`).
- **Toasts:** Smooth entry from top-right (`animate-in fade-in slide-in-from-top-2 duration-300`).
- **Live Pulses:** Pulsing indicators on live hackathons and notification badges (`animate-ping`).
- **Skeleton Loaders:** Shimmering animated skeletons while fetching data from Supabase, avoiding layout shift.

---

## 7. Accessibility & Ergonomics Standards

- **Color Contrast:** All body text meets WCAG 2.1 AA contrast ratio (> 4.5:1 against light canvas).
- **Keyboard Navigation:** Full tab traversal with focus rings (`focus:ring-2 focus:ring-[#0099e6] focus:ring-offset-2`).
- **Touch Ergonomics:** All interactive buttons and touch targets are a minimum of `44px x 44px` on mobile screens.
