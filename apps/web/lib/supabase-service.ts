import { supabase } from './supabase';
import { ExtendedEvent, MOCK_EVENTS } from './mock-data';
import { getEventPreviewToken, isEventRegistrationClosed, isEventEnded, filterDisplayTags, extractRegistrationLink, isExternalRedirectAllowed } from './utils';
import {
  UserPublic,
  EventStatus,
  EventCategory,
  EventType,
  NotificationDbType,
  NotificationTargetType,
} from '@hackers-unity/shared-types';
import { createNotification, sendNotificationToUser, sendOrganizerAlertNotification } from './notification-service';
import {
  getCustomEvents,
  getAllEvents,
  saveHostedEvent,
  ProjectSubmission,
  getAllProjectSubmissions,
  getProjectSubmission,
  saveProjectSubmission,
  deleteProjectSubmission,
  updateProjectSubmissionStatus,
  registerForEventStorage,
  saveEventRegistration,
  getLocalEventTeams,
  saveLocalEventTeam,
  getLocalTeamWithMembers,
  deleteLocalTeam,
  joinLocalEventTeam,
  removeMemberFromLocalTeam,
  removeRegistrationForEvent,
  getLocalTeamInvites,
  saveLocalTeamInvite,
  getLocalInviteByToken,
  updateLocalInviteStatus,
  getLocalPendingInvitesForEmail,
  getEventRegistrationsCount,
} from './storage';

/**
 * ─── HELPER: MAP DATABASE EVENT ROW TO EXTENDED EVENT ─────────────────────────
 */
export function mapDbEventToExtended(item: any): ExtendedEvent {
  const isTeam = item.is_team_event ?? true;
  const minTeam = Number(item.min_team_size || (isTeam ? 2 : 1));
  const maxTeam = Number(item.max_team_size || (isTeam ? 4 : 1));
  const teamSizeDisplay = minTeam === maxTeam ? `${minTeam}` : `${minTeam}-${maxTeam}`;

  const prizeVal = Number(item.total_prize_value || 0);
  const currency = item.currency || 'INR';
  const formattedPrize =
    prizeVal > 0
      ? item.prize && !item.prize.includes('$')
        ? item.prize
        : currency === 'INR'
        ? `₹${prizeVal.toLocaleString('en-IN')}`
        : `$${prizeVal.toLocaleString('en-US')}`
      : 'Perks & Swag';

  return {
    id: item.id,
    organizerId: item.organizer_id || item.created_by || 'usr_organizer',
    organizerName: item.organizer_name || "Hacker's Unity",
    organizerAvatar: item.organizer_avatar || '⚡',
    organizerLogo: item.logo_url || '',
    title: item.title,
    name: item.title,
    slug: item.slug,
    description: item.description || '',
    category: (item.category as EventCategory) || EventCategory.HACKATHON,
    eventType: (item.event_type as EventType) || EventType.ONLINE,
    mode: item.event_type === EventType.ONLINE ? 'Online' : item.event_type === EventType.OFFLINE ? 'In-Person' : 'Hybrid',
    startDate: item.start_date,
    endDate: item.end_date,
    registrationDeadline: item.registration_deadline,
    eligibilityRules: {
      teamSize: isTeam ? `${teamSizeDisplay} Members` : 'Individual',
      eligibility: item.eligibility || 'Open worldwide to developers and builders',
    },
    prizes: item.prizes || [],
    totalPrizeValue: prizeVal,
    prize: formattedPrize,
    prizeAmount: prizeVal,
    bannerUrl: item.banner_url || item.image || null,
    image: item.image || item.banner_url || null,
    logoUrl: item.logo_url || null,
    rulesDocUrl: item.rules_doc_url || null,
    registrationLink: item.registration_link || extractRegistrationLink(item) || null,
    allowExternalRedirect: isExternalRedirectAllowed(item),
    status: (() => {
      const rawStatus = (item.status as EventStatus) || EventStatus.PUBLISHED;
      const statusUpper = String(rawStatus || '').toUpperCase();
      if (
        statusUpper === 'DRAFT' ||
        statusUpper === 'PENDING_APPROVAL' ||
        statusUpper === 'REJECTED'
      ) {
        return rawStatus;
      }
      if (statusUpper === 'COMPLETED' || isEventEnded(item.end_date)) {
        return EventStatus.COMPLETED;
      }
      if (isEventRegistrationClosed(item.registration_deadline, item.end_date)) {
        return EventStatus.REGISTRATION_CLOSED;
      }
      return rawStatus;
    })(),
    maxParticipants: item.max_participants || 2000,
    minTeamSize: minTeam,
    maxTeamSize: maxTeam,
    teamSize: isTeam ? teamSizeDisplay : 'Individual',
    isTeamEvent: isTeam,
    location: item.location || 'Online',
    createdAt: item.created_at || new Date().toISOString(),
    participantsCount: Math.max(
      typeof item.registration_count === 'number' ? item.registration_count : 0,
      typeof item.participants_count === 'number' ? item.participants_count : 0
    ),
    registrationCount: Math.max(
      typeof item.registration_count === 'number' ? item.registration_count : 0,
      typeof item.participants_count === 'number' ? item.participants_count : 0
    ),
    registration_count: typeof item.registration_count === 'number' ? item.registration_count : 0,
    participantsDisplay: `${Math.max(
      typeof item.registration_count === 'number' ? item.registration_count : 0,
      typeof item.participants_count === 'number' ? item.participants_count : 0
    )}`,
    featured: Boolean(item.featured),
    tags: (() => {
      const clean = filterDisplayTags(item.tags);
      return clean.length > 0 ? clean : ['Hackathon', 'Innovation'];
    })(),
    displayOrder: (() => {
      if (typeof item.display_order === 'number' && !isNaN(item.display_order)) {
        return item.display_order;
      }
      if (Array.isArray(item.tags)) {
        const orderTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_order:'));
        if (orderTag) {
          const parsed = parseInt(orderTag.replace('hu_order:', ''), 10);
          if (!isNaN(parsed)) return parsed;
        }
      }
      return undefined;
    })(),
    bannerGradient: item.banner_gradient || 'from-sky-950/60 via-slate-900/80 to-black',
    tracks: item.tracks || [],
    stages: item.stages || [],
    faqs: item.faqs || [],
    sponsors: item.sponsors || [],
    tagline: item.tagline || item.short_description || '',
    timezone: item.timezone || 'Asia/Kolkata',
    eligibility: item.eligibility || 'Open to all builders',
    difficulty: item.difficulty || 'OPEN',
    rulesText: item.rules_text || '',
    registrationType: item.registration_type || (Number(item.entry_fee) > 0 ? 'PAID' : 'FREE'),
    entryFee: (() => {
      const dbFee = Number(item.entry_fee !== undefined && item.entry_fee !== null ? item.entry_fee : (item.entryFee ?? 0));
      return isNaN(dbFee) ? 0 : dbFee;
    })(),
    currency: item.currency || 'INR',
    registrationCapacity: item.registration_capacity || null,
    approvalMode: item.approval_mode || 'MANUAL',
    customQuestions: (() => {
      if (Array.isArray(item.custom_questions) && item.custom_questions.length > 0) {
        return item.custom_questions;
      }
      if (Array.isArray(item.tags)) {
        const qTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_custom_q:'));
        if (qTag) {
          try {
            return JSON.parse(qTag.substring('hu_custom_q:'.length));
          } catch {}
        }
      }
      return item.custom_questions || [];
    })(),
    registrationFields: (() => {
      if (Array.isArray(item.registration_fields) && item.registration_fields.length > 0) {
        return item.registration_fields;
      }
      if (Array.isArray(item.tags)) {
        const fTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_reg_fields:'));
        if (fTag) {
          try {
            return JSON.parse(fTag.substring('hu_reg_fields:'.length));
          } catch {}
        }
      }
      return item.registration_fields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'];
    })(),
    submissionFields: (() => {
      if (Array.isArray(item.submission_fields) && item.submission_fields.length > 0) {
        return item.submission_fields;
      }
      if (Array.isArray(item.submissionFields) && item.submissionFields.length > 0) {
        return item.submissionFields;
      }
      if (Array.isArray(item.tags)) {
        const sTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_fields:'));
        if (sTag) {
          try {
            return JSON.parse(sTag.substring('hu_sub_fields:'.length));
          } catch {}
        }
      }
      return undefined;
    })(),
    submissionGuidelines: (() => {
      if (typeof item.submission_guidelines === 'string' && item.submission_guidelines) {
        return item.submission_guidelines;
      }
      if (typeof item.submissionGuidelines === 'string' && item.submissionGuidelines) {
        return item.submissionGuidelines;
      }
      if (Array.isArray(item.tags)) {
        const gTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_guide:'));
        if (gTag) {
          try {
            return JSON.parse(gTag.substring('hu_sub_guide:'.length));
          } catch {
            return gTag.substring('hu_sub_guide:'.length);
          }
        }
      }
      return undefined;
    })(),
    submissionsEnabled: (() => {
      // 1. Check tags schedule tag first (most authoritative from host editor)
      if (Array.isArray(item.tags)) {
        const scTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_schedule:'));
        if (scTag) {
          try {
            const p = JSON.parse(scTag.substring('hu_sub_schedule:'.length));
            if (typeof p.enabled === 'boolean') return p.enabled;
          } catch {}
        }
      }
      // 2. Check direct columns
      if (item.submissions_enabled === false || item.submissionsEnabled === false) return false;
      if (typeof item.submissions_enabled === 'boolean') return item.submissions_enabled;
      if (typeof item.submissionsEnabled === 'boolean') return item.submissionsEnabled;
      return true;
    })(),
    submissionStartDate: (() => {
      if (Array.isArray(item.tags)) {
        const scTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_schedule:'));
        if (scTag) {
          try {
            const p = JSON.parse(scTag.substring('hu_sub_schedule:'.length));
            if (p.startIso || p.startDate) {
              return p.startIso || `${p.startDate}T${p.startTime || '09:00'}:00Z`;
            }
          } catch {}
        }
      }
      if (item.submission_start_date) return item.submission_start_date;
      if (item.submissionStartDate) return item.submissionStartDate;
      return null;
    })(),
    submissionDeadline: (() => {
      if (Array.isArray(item.tags)) {
        const scTag = item.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_sub_schedule:'));
        if (scTag) {
          try {
            const p = JSON.parse(scTag.substring('hu_sub_schedule:'.length));
            if (p.endIso || p.endDate) {
              return p.endIso || `${p.endDate}T${p.endTime || '18:00'}:00Z`;
            }
          } catch {}
        }
      }
      if (item.submission_deadline) return item.submission_deadline;
      if (item.submissionDeadline) return item.submissionDeadline;
      if (item.submission_end_date) return item.submission_end_date;
      if (item.submissionEndDate) return item.submissionEndDate;
      return null;
    })(),
    previewToken: item.preview_token || item.previewToken || (item.slug ? getEventPreviewToken(item) : undefined),
    ctaText: item.cta_text || item.ctaText || undefined,
  };
}

/**
 * ─── 1. SLUG GENERATOR ────────────────────────────────────────────────────────
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || 'hackathon';
  try {
    const { data } = await supabase
      .from('events')
      .select('slug')
      .ilike('slug', `${baseSlug}%`);

    if (!data || data.length === 0) {
      return baseSlug;
    }

    const existingSlugs = new Set(data.map((row: any) => row.slug));
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let counter = 1;
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter++;
    }
    return `${baseSlug}-${counter}`;
  } catch {
    return `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }
}

/**
 * ─── 2. ASSET UPLOAD (Cloudinary with Supabase Storage Fallback) ───────────────
 */
export async function uploadHackathonAsset(
  file: File,
  folder: 'logos' | 'banners' | 'general' = 'general'
): Promise<{ url: string | null; error?: string }> {
  try {
    // 1. Primary: Upload to Cloudinary via /api/upload
    try {
      if (typeof window !== 'undefined') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.url) {
            return { url: json.url };
          }
        }
      }
    } catch (uploadRouteErr) {
      console.warn('[Cloudinary upload fallback to Supabase Storage]:', uploadRouteErr);
    }

    // 2. Secondary fallback: Supabase Storage
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('hackathon-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('hackathon-assets')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    return { url: null, error: err.message || 'Upload failed' };
  }
}

/**
 * ─── 3. EVENT QUERIES ─────────────────────────────────────────────────────────
 */
export async function fetchPublishedEvents(): Promise<ExtendedEvent[]> {
  try {
    const deletedIds: string[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('hackers_unity_deleted_events') || '[]')
        : [];

    const custom = typeof window !== 'undefined' ? getCustomEvents() : [];

    const hiddenIdSet = new Set<string>();

    // 1. Fetch authoritative published events and hidden IDs via server endpoint FIRST (fast ~30ms, zero CORS issues)
    let remoteRows: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const apiRes = await fetch('/api/events', { cache: 'no-store' });
        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (Array.isArray(apiJson.events) && apiJson.events.length > 0) {
            remoteRows = apiJson.events;
          }
          if (Array.isArray(apiJson.hiddenIds)) {
            apiJson.hiddenIds.forEach((id: string) => hiddenIdSet.add(String(id).toLowerCase()));
          }
          if (Array.isArray(apiJson.hiddenSlugs)) {
            apiJson.hiddenSlugs.forEach((slug: string) => hiddenIdSet.add(String(slug).toLowerCase()));
          }
        }
      } catch (apiErr) {
        console.warn('API events initial fetch error, falling back:', apiErr);
      }
    }

    // 2. Direct Supabase query fallback (only if server API returned no rows or network offline)
    if (remoteRows.length === 0) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .in('status', ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'])
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          remoteRows = data;
        }
      } catch (supaErr) {
        console.warn('Direct Supabase fetchPublishedEvents notice:', supaErr);
      }

      // Query hidden/rejected status only if not already loaded from server API
      if (hiddenIdSet.size === 0) {
        try {
          const { data: rejectedOrHiddenData } = await supabase
            .from('events')
            .select('id, slug, status')
            .in('status', ['REJECTED', 'DRAFT', 'PENDING_APPROVAL']);

          if (rejectedOrHiddenData && rejectedOrHiddenData.length > 0) {
            rejectedOrHiddenData.forEach((row: any) => {
              if (row.id) hiddenIdSet.add(String(row.id).toLowerCase());
              if (row.slug) hiddenIdSet.add(String(row.slug).toLowerCase());
            });
          }
        } catch {}
      }
    }

    let list: ExtendedEvent[] = [];
    if (remoteRows.length > 0) {
      list = remoteRows.map(mapDbEventToExtended);
    }

    // Auto-clean stale rejected events from browser localStorage so they NEVER linger
    if (typeof window !== 'undefined') {
      try {
        const rawCustom = localStorage.getItem('hackers_unity_hosted_events');
        if (rawCustom) {
          const parsed = JSON.parse(rawCustom);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((evt: any) => {
              const id = String(evt.id || '').toLowerCase();
              const slug = String(evt.slug || '').toLowerCase();
              const s = String(evt.status || '').toUpperCase();
              if (s === 'REJECTED' || hiddenIdSet.has(id) || hiddenIdSet.has(slug)) {
                return false;
              }
              // If remote published list is available, any database UUID/evt_ not in the published list was rejected/revoked!
              if (
                list.length > 0 &&
                (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(evt.id) ||
                  String(evt.id).startsWith('evt_'))
              ) {
                const inRemote = list.some(
                  (r) => r.id.toLowerCase() === id || (r.slug && r.slug.toLowerCase() === slug)
                );
                if (!inRemote) return false;
              }
              return true;
            });
            if (cleaned.length !== parsed.length) {
              localStorage.setItem('hackers_unity_hosted_events', JSON.stringify(cleaned));
            }
          }
        }

        // Clean stale overrides
        const rawOverrides = localStorage.getItem('hackers_unity_events_overrides');
        if (rawOverrides) {
          const parsedOverrides = JSON.parse(rawOverrides);
          let changed = false;
          Object.keys(parsedOverrides).forEach((k) => {
            const kLower = k.toLowerCase();
            if (hiddenIdSet.has(kLower)) {
              delete parsedOverrides[k];
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem('hackers_unity_events_overrides', JSON.stringify(parsedOverrides));
          }
        }
      } catch {}
    }

    // Merge remote list, curated platform MOCK_EVENTS, and custom events (avoiding duplicate slugs/ids)
    const map = new Map<string, ExtendedEvent>();
    
    // 1. Seed with curated mock events (Code-ए-Manipal #1, etc.)
    MOCK_EVENTS.forEach((e) => {
      const eId = String(e.id || '').toLowerCase();
      const eSlug = String(e.slug || '').toLowerCase();
      const eStatus = String(e.status || '').toUpperCase();
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        !hiddenIdSet.has(eId) &&
        !hiddenIdSet.has(eSlug) &&
        eStatus !== 'REJECTED' &&
        eStatus !== 'DRAFT' &&
        eStatus !== 'PENDING_APPROVAL'
      ) {
        map.set(e.id || e.slug, e);
      }
    });

    // 2. Local custom events complement (only if verified published/active, never if rejected or revoked)
    custom.forEach((e) => {
      const eId = String(e.id || '').toLowerCase();
      const eSlug = String(e.slug || '').toLowerCase();
      const eStatus = String(e.status || '').toUpperCase();
      const isDbEvent =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id) ||
        String(e.id || '').startsWith('evt_');

      // If remote database events are loaded, NEVER inject an unverified or revoked DB event from localStorage
      if (list.length > 0 && isDbEvent) {
        const inRemote = list.some(
          (rem) => rem.id.toLowerCase() === eId || (rem.slug && rem.slug.toLowerCase() === eSlug)
        );
        if (!inRemote) {
          return;
        }
      }

      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        !hiddenIdSet.has(eId) &&
        !hiddenIdSet.has(eSlug) &&
        eStatus !== 'REJECTED' &&
        eStatus !== 'DRAFT' &&
        eStatus !== 'PENDING_APPROVAL' &&
        e.status !== EventStatus.PENDING_APPROVAL &&
        e.status !== EventStatus.DRAFT
      ) {
        let matchedKey: string | null = null;
        for (const [k, val] of map.entries()) {
          if (val.id === e.id || val.slug === e.slug) {
            matchedKey = k;
            break;
          }
        }
        if (matchedKey) {
          map.set(matchedKey, { ...map.get(matchedKey), ...e });
        } else {
          map.set(e.id || e.slug, e);
        }
      }
    });

    // 3. Remote Supabase events overwrite everything! (True source of truth)
    list.forEach((e) => {
      const eId = String(e.id || '').toLowerCase();
      const eSlug = String(e.slug || '').toLowerCase();
      const eStatus = String(e.status || '').toUpperCase();
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        !hiddenIdSet.has(eId) &&
        !hiddenIdSet.has(eSlug) &&
        eStatus !== 'REJECTED' &&
        eStatus !== 'DRAFT' &&
        eStatus !== 'PENDING_APPROVAL'
      ) {
        let matchedKey: string | null = null;
        for (const [k, val] of map.entries()) {
          if (
            val.id === e.id ||
            val.slug === e.slug ||
            (e.id === '5d8e3b96-a647-4ecb-a24c-904729d9f7f6' &&
              (val.id === '5d8e3b96-a647-4ecb-a24c-904729d9f7f6' ||
                val.slug === 'code-e-manipal-2-0' ||
                val.slug === 'evt_ai_1789569251573'))
          ) {
            matchedKey = k;
            break;
          }
        }

        if (matchedKey) {
          const existing = map.get(matchedKey)!;
          const mergedParticipants = Math.max(existing.participantsCount || 0, e.participantsCount || 0);
          map.set(matchedKey, {
            ...existing,
            ...e,
            participantsCount: mergedParticipants,
            registrationCount: Math.max(existing.registrationCount || 0, e.registrationCount || 0, mergedParticipants),
            participantsDisplay: existing.participantsDisplay && (existing.participantsCount || 0) > (e.participantsCount || 0) ? existing.participantsDisplay : e.participantsDisplay,
          });
        } else {
          map.set(e.id || e.slug, e);
        }
      }
    });

    const sortEventsList = (eventsList: ExtendedEvent[]): ExtendedEvent[] => {
      let clientOrder: string[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('hackers_unity_showcase_order');
          if (raw) clientOrder = JSON.parse(raw);
        } catch {}
      }

      return [...eventsList].sort((a, b) => {
        let orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 999999;
        let orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 999999;

        if (clientOrder.length > 0) {
          const idxA = clientOrder.findIndex((id) => id === a.id || id === a.slug);
          const idxB = clientOrder.findIndex((id) => id === b.id || id === b.slug);
          if (idxA !== -1) orderA = idxA;
          if (idxB !== -1) orderB = idxB;
        }

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    };

    const isManipal = (e: ExtendedEvent) => {
      const s = (e.slug || '').toLowerCase();
      const t = (e.title || '').toLowerCase();
      const n = (e.name || '').toLowerCase();
      const id = (e.id || '').toLowerCase();
      return (
        s === 'code-e-manipal-2-0' ||
        s === 'code-e-manipal' ||
        s === 'evt_ai_1789569251573' ||
        id === '5d8e3b96-a647-4ecb-a24c-904729d9f7f6' ||
        t.includes('code-ए-manipal') ||
        t.includes('code-e-manipal') ||
        n.includes('code-ए-manipal') ||
        n.includes('code-e-manipal')
      );
    };

    const isExcluded = (e: ExtendedEvent) => {
      if (isManipal(e)) return true;
      const statusUpper = String(e.status || '').toUpperCase();
      if (
        statusUpper === 'REJECTED' ||
        statusUpper === 'DRAFT' ||
        statusUpper === 'PENDING_APPROVAL' ||
        e.status === EventStatus.PENDING_APPROVAL ||
        e.status === EventStatus.DRAFT
      ) {
        return true;
      }
      const eId = String(e.id || '').toLowerCase();
      const eSlug = String(e.slug || '').toLowerCase();
      if (hiddenIdSet.has(eId) || (eSlug && hiddenIdSet.has(eSlug))) {
        return true;
      }
      if (deletedIds.includes(e.id) || (e.slug && deletedIds.includes(e.slug))) {
        return true;
      }
      return false;
    };

    return sortEventsList(Array.from(map.values()).filter((e) => !isExcluded(e)));
  } catch (err) {
    console.warn('Supabase fetchPublishedEvents exception:', err);
    const deletedIds: string[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('hackers_unity_deleted_events') || '[]')
        : [];
    const custom = typeof window !== 'undefined' ? getCustomEvents() : [];
    const map = new Map<string, ExtendedEvent>();
    MOCK_EVENTS.forEach((e) => {
      const s = String(e.status || '').toUpperCase();
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        s !== 'REJECTED' &&
        s !== 'DRAFT' &&
        s !== 'PENDING_APPROVAL'
      ) {
        map.set(e.id, e);
      }
    });
    custom.forEach((e) => {
      const s = String(e.status || '').toUpperCase();
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        s !== 'REJECTED' &&
        s !== 'DRAFT' &&
        s !== 'PENDING_APPROVAL' &&
        e.status !== EventStatus.PENDING_APPROVAL &&
        e.status !== EventStatus.DRAFT
      ) {
        map.set(e.id, e);
      }
    });

    let clientOrder: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('hackers_unity_showcase_order');
        if (raw) clientOrder = JSON.parse(raw);
      } catch {}
    }

    const isManipal = (e: ExtendedEvent) => {
      const s = (e.slug || '').toLowerCase();
      const t = (e.title || '').toLowerCase();
      const n = (e.name || '').toLowerCase();
      const id = (e.id || '').toLowerCase();
      return (
        s === 'code-e-manipal-2-0' ||
        s === 'code-e-manipal' ||
        s === 'evt_ai_1789569251573' ||
        id === '5d8e3b96-a647-4ecb-a24c-904729d9f7f6' ||
        t.includes('code-ए-manipal') ||
        t.includes('code-e-manipal') ||
        n.includes('code-ए-manipal') ||
        n.includes('code-e-manipal')
      );
    };

    return Array.from(map.values())
      .filter((e) => {
        if (isManipal(e)) return false;
        const s = String(e.status || '').toUpperCase();
        if (s === 'REJECTED' || s === 'DRAFT' || s === 'PENDING_APPROVAL') return false;
        if (deletedIds.includes(e.id) || (e.slug && deletedIds.includes(e.slug))) return false;
        return true;
      })
      .sort((a, b) => {
        let orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 999999;
        let orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 999999;
        if (clientOrder.length > 0) {
          const idxA = clientOrder.findIndex((id) => id === a.id || id === a.slug);
          const idxB = clientOrder.findIndex((id) => id === b.id || id === b.slug);
          if (idxA !== -1) orderA = idxA;
          if (idxB !== -1) orderB = idxB;
        }
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }
}

export async function fetchEventBySlug(slugOrId: string): Promise<ExtendedEvent | null> {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId).trim();

  // If user navigated to Code-e-Manipal, return null
  const lowerDecoded = decoded.toLowerCase();
  if (
    lowerDecoded === 'code-e-manipal-2-0' ||
    lowerDecoded === 'code-e-manipal' ||
    lowerDecoded === '5d8e3b96-a647-4ecb-a24c-904729d9f7f6' ||
    lowerDecoded === 'evt_ai_1789569251573' ||
    lowerDecoded.includes('code-e-manipal')
  ) {
    return null;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

    let data: any = null;

    // 1. Authoritative server endpoint FIRST (fast ~30ms, zero CORS issues, bypasses RLS)
    if (typeof window !== 'undefined') {
      try {
        const verifyRes = await fetch(`/api/events?slug=${encodeURIComponent(decoded)}`, { cache: 'no-store' });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData?.event) {
            data = verifyData.event;
          }
        }
      } catch (apiErr) {
        console.warn('API event query notice, falling back:', apiErr);
      }
    }

    // 2. Direct Supabase fallback only if server endpoint didn't find or network offline
    if (!data) {
      if (isUuid) {
        const res = await supabase
          .from('events')
          .select('*')
          .or(`id.eq.${decoded},slug.eq.${decoded}`)
          .maybeSingle();
        data = res.data;
      } else {
        // Query by slug without touching the UUID id column
        const res = await supabase
          .from('events')
          .select('*')
          .eq('slug', decoded)
          .maybeSingle();
        data = res.data;

        // Fallback to case-insensitive match if needed
        if (!data) {
          const ilikeRes = await supabase
            .from('events')
            .select('*')
            .ilike('slug', decoded)
            .maybeSingle();
          data = ilikeRes.data;
        }

        // Fallback for code-e-manipal aliases
        if (!data && (decoded === 'code-e-manipal-2-0' || decoded === 'evt_ai_1789569251573' || decoded === 'code-e-manipal')) {
          const aliasRes = await supabase
            .from('events')
            .select('*')
            .or('slug.eq.code-e-manipal-2-0,slug.eq.evt_ai_1789569251573,id.eq.5d8e3b96-a647-4ecb-a24c-904729d9f7f6')
            .maybeSingle();
          data = aliasRes.data;
        }

        // Fallback: title normalized match if slug was custom or ai-generated
        if (!data) {
          const titleNormalized = decoded.replace(/-/g, ' ').trim();
          const titleRes = await supabase
            .from('events')
            .select('*')
            .ilike('title', titleNormalized)
            .maybeSingle();
          data = titleRes.data;
        }
      }
    }

    if (data) {
      const mapped = mapDbEventToExtended(data);
      if (typeof window !== 'undefined') {
        try {
          const rawOverrides = localStorage.getItem('hackers_unity_events_overrides') || localStorage.getItem('hackers_unity_events_override');
          if (rawOverrides) {
            const overrides = JSON.parse(rawOverrides);
            const override = overrides[mapped.id] || (mapped.slug ? overrides[mapped.slug] : null);
            if (override) {
              const res = { ...mapped, ...override };
              // Ensure verified database content and schedule take precedence over stale client overrides
              if (mapped.description) res.description = mapped.description;
              if (mapped.title) res.title = mapped.title;
              if (mapped.bannerUrl) res.bannerUrl = mapped.bannerUrl;
              if (mapped.logoUrl) res.logoUrl = mapped.logoUrl;
              if (mapped.startDate) res.startDate = mapped.startDate;
              if (mapped.endDate) res.endDate = mapped.endDate;
              if (mapped.registrationDeadline) res.registrationDeadline = mapped.registrationDeadline;
              if (mapped.registrationStart) res.registrationStart = mapped.registrationStart;
              if (mapped.entryFee !== undefined && mapped.entryFee !== null) res.entryFee = mapped.entryFee;
              if (mapped.registrationType) res.registrationType = mapped.registrationType;

              // CRITICAL: Database permissions, status, registration redirect and tags ALWAYS take precedence over local overrides
              res.allowExternalRedirect = isExternalRedirectAllowed(mapped);
              if (mapped.registrationLink) res.registrationLink = mapped.registrationLink;
              if (mapped.status) res.status = mapped.status;
              if (Array.isArray(mapped.tags)) {
                const combinedTags = Array.from(new Set([...(Array.isArray(res.tags) ? res.tags : []), ...mapped.tags]));
                if (!isExternalRedirectAllowed(mapped)) {
                  res.tags = combinedTags.filter((t) => t !== 'allow_external_redirect');
                } else {
                  res.tags = combinedTags;
                }
              }

              // Also sync local override in storage so subsequent client reads reflect authoritative DB state
              try {
                override.allowExternalRedirect = res.allowExternalRedirect;
                override.tags = res.tags;
                if (res.registrationLink) override.registrationLink = res.registrationLink;
                overrides[mapped.id] = override;
                if (mapped.slug) overrides[mapped.slug] = override;
                localStorage.setItem('hackers_unity_events_overrides', JSON.stringify(overrides));
                localStorage.setItem('hackers_unity_events_override', JSON.stringify(overrides));
              } catch {}

              return res;
            }
          }
        } catch {}
      }
      if (typeof window !== 'undefined') {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const currentUserId = sessionData?.session?.user?.id;
          if (currentUserId && currentUserId !== (data.organizer_id || (data as any).organizerId)) {
            const { data: adminRecord } = await supabase
              .from('event_admins')
              .select('id')
              .eq('event_id', mapped.id)
              .eq('user_id', currentUserId)
              .maybeSingle();

            if (adminRecord) {
              (mapped as any).isCoHost = true;
            }
          }
        } catch {}
      }
      return mapped;
    }

    // Check custom events in local storage (never resurrect rejected or deleted events)
    if (typeof window !== 'undefined') {
      const custom = getCustomEvents();
      const customFound = custom.find(
        (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
      );
      if (customFound) {
        const s = String(customFound.status || '').toUpperCase();
        if (s !== 'REJECTED' && s !== 'DRAFT' && s !== 'PENDING_APPROVAL') {
          return customFound;
        }
      }
    }

    // Fallback to mock search
    const found = MOCK_EVENTS.find(
      (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
    );
    return found || null;
  } catch (err) {
    console.warn('fetchEventBySlug exception:', err);
    if (typeof window !== 'undefined') {
      const custom = getCustomEvents();
      const customFound = custom.find(
        (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
      );
      if (customFound) return customFound;
    }
    const found = MOCK_EVENTS.find(
      (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
    );
    return found || null;
  }
}

export async function fetchOrganizerEvents(organizerId: string): Promise<ExtendedEvent[]> {
  try {
    if (!organizerId) return [];

    const deletedIds: string[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('hackers_unity_deleted_events') || '[]')
        : [];

    let remoteEvents: ExtendedEvent[] = [];
    let coHostedEvents: ExtendedEvent[] = [];

    // 1. Try server-side same-origin API FIRST (fast ~30ms, zero CORS issues, includes hosted & co-hosted)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/events?organizerId=${encodeURIComponent(organizerId)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.events) && json.events.length > 0) {
            remoteEvents = json.events.map(mapDbEventToExtended);
          }
        }
      } catch (apiErr) {
        console.warn('API fetchOrganizerEvents error, falling back:', apiErr);
      }
    }

    // 2. Direct Supabase client fallback (only if server API returned no rows or network offline)
    if (remoteEvents.length === 0) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .or(`organizer_id.eq.${organizerId},created_by.eq.${organizerId}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          remoteEvents = data.map(mapDbEventToExtended);
        }
      } catch (supaErr) {
        console.warn('Direct Supabase fetchOrganizerEvents notice:', supaErr);
      }

      // Also query events where user is a co-host / event admin
      try {
        const { data: adminRows } = await supabase
          .from('event_admins')
          .select('event_id')
          .eq('user_id', organizerId);

        if (adminRows && adminRows.length > 0) {
          const coHostEventIds = adminRows.map((r: any) => r.event_id).filter(Boolean);
          if (coHostEventIds.length > 0) {
            const { data: coHostData } = await supabase
              .from('events')
              .select('*')
              .in('id', coHostEventIds);

            if (coHostData && coHostData.length > 0) {
              coHostedEvents = coHostData.map((d: any) => {
                const mapped = mapDbEventToExtended(d);
                (mapped as any).isCoHost = true;
                return mapped;
              });
            }
          }
        }
      } catch (adminErr) {
        console.warn('Could not query co-hosted events:', adminErr);
      }
    }

    const custom = typeof window !== 'undefined' ? getCustomEvents() : [];
    // Strictly match only events belonging to THIS organizer
    const customOrganizerEvents = custom.filter(
      (e) => e.organizerId === organizerId
    );

    const map = new Map<string, ExtendedEvent>();
    remoteEvents.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
        map.set(e.id, e);
      }
    });
    coHostedEvents.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug) && !map.has(e.id)) {
        map.set(e.id, e);
      }
    });
    customOrganizerEvents.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug) && !map.has(e.id)) {
        map.set(e.id, e);
      }
    });

    return Array.from(map.values());
  } catch {
    return [];
  }
}

/**
 * ─── 4. EVENT MUTATIONS ───────────────────────────────────────────────────────
 */
export async function createEventInSupabase(
  event: Partial<ExtendedEvent>,
  userId?: string
): Promise<{ success: boolean; data?: ExtendedEvent; error?: string }> {
  try {
    // 1. Try server API route first (runs with server credentials, bypasses client RLS issues)
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, userId }),
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            const createdEvent = mapDbEventToExtended(resData.data);

            // Broadcast realtime
            try {
              const channel = supabase.channel('public:events_realtime');
              channel.send({
                type: 'broadcast',
                event: 'event_created',
                payload: { event: createdEvent },
              });
            } catch (e) {
              console.warn('Broadcast send error:', e);
            }

            // Save in local storage as well for instant hydration
            saveHostedEvent(createdEvent);

            return { success: true, data: createdEvent };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/events call error, falling back to direct client:', apiErr);
      }
    }

    // 2. Fallback: Direct client insertion
    const finalSlug = event.slug || (await generateUniqueSlug(event.title || 'untitled-hackathon'));

    // Validate status against DB CHECK constraint
    const VALID_STATUSES = [
      'DRAFT',
      'PENDING_APPROVAL',
      'PUBLISHED',
      'REGISTRATION_OPEN',
      'LIVE',
      'JUDGING',
      'COMPLETED',
      'ARCHIVED',
      'REJECTED',
    ];
    const sanitizedStatus = VALID_STATUSES.includes(event.status || '')
      ? event.status
      : 'PENDING_APPROVAL';

    // Validate organizer_id: ensure the profile exists to avoid FK constraint error
    let validOrganizerId: string | null = null;
    if (userId) {
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      validOrganizerId = profileExists ? userId : null;
    }

    const insertPayload: any = {
      slug: finalSlug,
      title: event.title || 'Untitled Hackathon',
      description: event.description || '',
      category: event.category || 'HACKATHON',
      event_type: event.eventType || 'ONLINE',
      location: event.location || 'Online',
      organizer_id: validOrganizerId,
      organizer_name: event.organizerName || 'Organizer',
      organizer_avatar: event.organizerAvatar || '⚡',
      start_date: event.startDate || new Date().toISOString(),
      end_date: event.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      registration_deadline: event.registrationDeadline || new Date().toISOString(),
      total_prize_value: Number(event.totalPrizeValue || 0),
      prizes: event.prizes || [],
      tracks: event.tracks || [],
      stages: event.stages || [],
      faqs: event.faqs || [],
      sponsors: event.sponsors || [],
      tags: event.tags || [],
      min_team_size: event.minTeamSize || 1,
      max_team_size: event.maxTeamSize || 4,
      is_team_event: event.isTeamEvent ?? true,
      featured: Boolean(event.featured),
      status: sanitizedStatus,
      tagline: event.tagline || '',
      logo_url: event.logoUrl || null,
      banner_url: event.bannerUrl || event.image || null,
      registration_start: event.registrationStart || null,
      timezone: event.timezone || 'Asia/Kolkata',
      eligibility: event.eligibility || null,
      difficulty: event.difficulty || 'OPEN',
      rules_text: event.rulesText || null,
      registration_type: event.registrationType || 'FREE',
      entry_fee: event.entryFee !== undefined && event.entryFee !== null ? Number(event.entryFee) : 0,
      currency: event.currency || 'INR',
      registration_capacity: event.registrationCapacity || 2000,
      approval_mode: event.approvalMode || 'AUTO',
      custom_questions: event.customQuestions || [],
      registration_fields: event.registrationFields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'],
      registration_link: event.registrationLink || null,
      submissions_enabled: typeof event.submissionsEnabled === 'boolean' ? event.submissionsEnabled : true,
      submission_start_date: event.submissionStartDate || null,
      submission_deadline: event.submissionDeadline || null,
    };

    if (
      Array.isArray(event.registrationFields) ||
      event.submissionFields ||
      event.submissionGuidelines ||
      event.submissionsEnabled !== undefined ||
      event.submissionStartDate !== undefined ||
      event.submissionDeadline !== undefined
    ) {
      if (!Array.isArray(insertPayload.tags)) insertPayload.tags = [];
      insertPayload.tags = insertPayload.tags.filter(
        (t: string) =>
          !t.startsWith('hu_reg_fields:') &&
          !t.startsWith('hu_custom_q:') &&
          !t.startsWith('hu_sub_fields:') &&
          !t.startsWith('hu_sub_guide:') &&
          !t.startsWith('hu_sub_schedule:')
      );
      if (Array.isArray(event.registrationFields)) {
        insertPayload.tags.push('hu_reg_fields:' + JSON.stringify(event.registrationFields));
      }
      if (Array.isArray(event.customQuestions) && event.customQuestions.length > 0) {
        insertPayload.tags.push('hu_custom_q:' + JSON.stringify(event.customQuestions));
      }
      if (Array.isArray(event.submissionFields) && event.submissionFields.length > 0) {
        insertPayload.tags.push('hu_sub_fields:' + JSON.stringify(event.submissionFields));
      }
      if (typeof event.submissionGuidelines === 'string' && event.submissionGuidelines.trim()) {
        insertPayload.tags.push('hu_sub_guide:' + JSON.stringify(event.submissionGuidelines.trim()));
      }
      if (
        event.submissionsEnabled !== undefined ||
        event.submissionStartDate !== undefined ||
        event.submissionDeadline !== undefined
      ) {
        insertPayload.tags.push(
          'hu_sub_schedule:' +
            JSON.stringify({
              enabled: event.submissionsEnabled !== false,
              startIso: event.submissionStartDate || null,
              endIso: event.submissionDeadline || null,
            })
        );
      }
    }

    let { data, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

    // Resilient fallback: If database schema lacks optional columns (code 42703 or PGRST204)
    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
      console.warn('DB missing columns on insert, retrying with tags fallback:', error.message);
      delete insertPayload.registration_fields;
      delete insertPayload.submissions_enabled;
      delete insertPayload.submission_start_date;
      delete insertPayload.submission_deadline;
      delete insertPayload.allow_external_redirect;
      delete insertPayload.registration_link;
      const retryCol = await supabase.from('events').insert(insertPayload).select('*').single();
      data = retryCol.data;
      error = retryCol.error;
    }

    // Resilient fallback: If database constraint 'events_status_check' fails because migration is pending
    if (error && error.code === '23514' && sanitizedStatus === 'PENDING_APPROVAL') {
      console.warn('DB check constraint rejected PENDING_APPROVAL, retrying with DRAFT status fallback');
      insertPayload.status = 'DRAFT';
      if (!insertPayload.tags.includes('PENDING_APPROVAL')) {
        insertPayload.tags.push('PENDING_APPROVAL');
      }
      const retry = await supabase.from('events').insert(insertPayload).select('*').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase event creation error:', error.message);
      // Fallback: save to local storage so user flow is never broken
      const fallbackEvent = event as ExtendedEvent;
      saveHostedEvent(fallbackEvent);
      return { success: true, data: fallbackEvent };
    }

    const createdEvent = mapDbEventToExtended(data);

    // Instant Realtime Broadcast to all connected clients/browsers
    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_created',
        payload: { event: createdEvent },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
    }
    // Automatically broadcast notification ONLY when event is approved/live, not while pending, and NOT if host disabled broadcast
    const tagsList = Array.isArray(createdEvent.tags) ? createdEvent.tags : [];
    const isBroadcastDisabled = tagsList.includes('hu_no_broadcast:true') || (createdEvent as any).broadcastToCommunity === false;

    if (
      !isBroadcastDisabled &&
      (createdEvent.status === EventStatus.PUBLISHED || (createdEvent.status as any) === 'REGISTRATION_OPEN')
    ) {
      createNotification(
        {
          title: `🚀 New Hackathon Live: ${createdEvent.title}`,
          message: `${createdEvent.title} is now open for registration! Check rules and form your squad.`,
          type: NotificationDbType.EVENT,
          icon: '🚀',
          eventId: createdEvent.id,
          targetType: NotificationTargetType.ALL,
          actionUrl: `/hackathons/${createdEvent.slug}`,
        },
        event.organizerId || 'usr_organizer'
      ).catch((e) => console.warn('Auto notification error on event create:', e));
    }

    saveHostedEvent(createdEvent);
    return { success: true, data: createdEvent };
  } catch (err: any) {
    const fallbackEvent = event as ExtendedEvent;
    saveHostedEvent(fallbackEvent);
    return { success: true, data: fallbackEvent };
  }
}

export async function updateEventInSupabase(
  eventId: string,
  updates: Partial<ExtendedEvent>
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try server API route first
    if (typeof window !== 'undefined') {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch('/api/events', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ eventId, updates }),
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            try {
              const rawOverrides = localStorage.getItem('hackers_unity_events_overrides') || localStorage.getItem('hackers_unity_events_override');
              if (rawOverrides) {
                const overrides = JSON.parse(rawOverrides);
                delete overrides[eventId];
                if (updates.slug) delete overrides[updates.slug];
                localStorage.setItem('hackers_unity_events_overrides', JSON.stringify(overrides));
                localStorage.setItem('hackers_unity_events_override', JSON.stringify(overrides));
              }
              window.dispatchEvent(new Event('hackers_unity_storage_change'));
            } catch {}
            return { success: true };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('[updateEventInSupabase] API PATCH returned error:', response.status, errData);
        }
      } catch (apiErr) {
        console.warn('API /api/events update error, falling back:', apiErr);
      }
    }

    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.eventType !== undefined) updatePayload.event_type = updates.eventType;
    if (updates.location !== undefined) updatePayload.location = updates.location;
    if (updates.startDate !== undefined) updatePayload.start_date = updates.startDate;
    if (updates.endDate !== undefined) updatePayload.end_date = updates.endDate;
    if (updates.registrationDeadline !== undefined) updatePayload.registration_deadline = updates.registrationDeadline;
    if (updates.totalPrizeValue !== undefined) updatePayload.total_prize_value = updates.totalPrizeValue;
    if (updates.prizes !== undefined) updatePayload.prizes = updates.prizes;
    if (updates.tracks !== undefined) updatePayload.tracks = updates.tracks;
    if (updates.stages !== undefined) updatePayload.stages = updates.stages;
    if (updates.faqs !== undefined) updatePayload.faqs = updates.faqs;
    if (updates.sponsors !== undefined) updatePayload.sponsors = updates.sponsors;
    if (updates.tags !== undefined) updatePayload.tags = updates.tags;
    if (updates.minTeamSize !== undefined) updatePayload.min_team_size = updates.minTeamSize;
    if (updates.maxTeamSize !== undefined) updatePayload.max_team_size = updates.maxTeamSize;
    if (updates.isTeamEvent !== undefined) updatePayload.is_team_event = updates.isTeamEvent;
    if (updates.featured !== undefined) updatePayload.featured = updates.featured;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.tagline !== undefined) updatePayload.tagline = updates.tagline;
    if (updates.logoUrl !== undefined) updatePayload.logo_url = updates.logoUrl;
    else if ((updates as any).logo_url !== undefined) updatePayload.logo_url = (updates as any).logo_url;

    if (updates.bannerUrl !== undefined) updatePayload.banner_url = updates.bannerUrl;
    else if ((updates as any).banner_url !== undefined) updatePayload.banner_url = (updates as any).banner_url;
    else if (updates.image !== undefined) updatePayload.banner_url = updates.image;

    if (updates.organizerName !== undefined) updatePayload.organizer_name = updates.organizerName;
    if (updates.organizerAvatar !== undefined) updatePayload.organizer_avatar = updates.organizerAvatar;
    if (updates.organizerId !== undefined) updatePayload.organizer_id = updates.organizerId;
    if (updates.registrationType !== undefined) updatePayload.registration_type = updates.registrationType;
    if (updates.entryFee !== undefined) updatePayload.entry_fee = updates.entryFee !== null ? Number(updates.entryFee) : 0;
    if (updates.currency !== undefined) updatePayload.currency = updates.currency;
    if (updates.registrationCapacity !== undefined) updatePayload.registration_capacity = updates.registrationCapacity;
    if (updates.approvalMode !== undefined) updatePayload.approval_mode = updates.approvalMode;
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    if (updates.registrationFields !== undefined) updatePayload.registration_fields = updates.registrationFields;
    if (updates.registrationLink !== undefined) updatePayload.registration_link = updates.registrationLink;
    if (updates.allowExternalRedirect !== undefined) updatePayload.allow_external_redirect = updates.allowExternalRedirect;
    if (updates.submissionsEnabled !== undefined) updatePayload.submissions_enabled = updates.submissionsEnabled;
    if (updates.submissionStartDate !== undefined) updatePayload.submission_start_date = updates.submissionStartDate;
    if (updates.submissionDeadline !== undefined) updatePayload.submission_deadline = updates.submissionDeadline;

    if (
      updates.registrationFields !== undefined ||
      updates.customQuestions !== undefined ||
      updates.submissionFields !== undefined ||
      updates.submissionGuidelines !== undefined ||
      updates.submissionsEnabled !== undefined ||
      updates.submissionStartDate !== undefined ||
      updates.submissionDeadline !== undefined
    ) {
      const existingTags = Array.isArray(updates.tags) ? [...updates.tags] : [];
      let newTags = existingTags.filter(
        (t: string) =>
          !t.startsWith('hu_reg_fields:') &&
          !t.startsWith('hu_custom_q:') &&
          !t.startsWith('hu_sub_fields:') &&
          !t.startsWith('hu_sub_guide:') &&
          !t.startsWith('hu_sub_schedule:')
      );
      if (updates.registrationFields) {
        newTags.push('hu_reg_fields:' + JSON.stringify(updates.registrationFields));
      }
      if (updates.customQuestions && updates.customQuestions.length > 0) {
        newTags.push('hu_custom_q:' + JSON.stringify(updates.customQuestions));
      }
      if (Array.isArray(updates.submissionFields) && updates.submissionFields.length > 0) {
        newTags.push('hu_sub_fields:' + JSON.stringify(updates.submissionFields));
      }
      if (typeof updates.submissionGuidelines === 'string' && updates.submissionGuidelines.trim()) {
        newTags.push('hu_sub_guide:' + JSON.stringify(updates.submissionGuidelines.trim()));
      }
      if (
        updates.submissionsEnabled !== undefined ||
        updates.submissionStartDate !== undefined ||
        updates.submissionDeadline !== undefined
      ) {
        newTags.push(
          'hu_sub_schedule:' +
            JSON.stringify({
              enabled: updates.submissionsEnabled !== false,
              startIso: updates.submissionStartDate || null,
              endIso: updates.submissionDeadline || null,
            })
        );
      }
      updatePayload.tags = newTags;
    }

    // Ensure tags are always synchronized with allow_external_redirect and hu_reg_link
    const allowRedirectVal = updates.allowExternalRedirect !== undefined
      ? Boolean(updates.allowExternalRedirect)
      : (updates as any).allow_external_redirect !== undefined
      ? Boolean((updates as any).allow_external_redirect)
      : undefined;

    const regLinkVal = updates.registrationLink !== undefined
      ? updates.registrationLink
      : (updates as any).registration_link !== undefined
      ? (updates as any).registration_link
      : undefined;

    let baseTags = updatePayload.tags !== undefined
      ? [...updatePayload.tags]
      : Array.isArray(updates.tags)
      ? [...updates.tags]
      : null;

    if (baseTags || allowRedirectVal !== undefined || regLinkVal !== undefined) {
      if (!baseTags) {
        baseTags = Array.isArray(updates.tags) ? [...updates.tags] : [];
      }
      if (allowRedirectVal !== undefined) {
        if (allowRedirectVal) {
          if (!baseTags.includes('allow_external_redirect')) baseTags.push('allow_external_redirect');
        } else {
          baseTags = baseTags.filter((t: string) => t !== 'allow_external_redirect');
        }
      }
      if (regLinkVal !== undefined) {
        baseTags = baseTags.filter((t: string) => typeof t === 'string' && !t.startsWith('hu_reg_link:') && !t.startsWith('hu_reg_url:'));
        if (typeof regLinkVal === 'string' && regLinkVal.trim()) {
          baseTags.push('hu_reg_link:' + regLinkVal.trim());
        }
      }
      updatePayload.tags = baseTags;
    }

    updatePayload.updated_at = new Date().toISOString();

    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let clientQuery = supabase.from('events').update(updatePayload);
    if (isUuid) {
      clientQuery = clientQuery.eq('id', eventId);
    } else {
      clientQuery = clientQuery.eq('slug', eventId);
    }
    let { error } = await clientQuery;

    let clientColRetries = 0;
    while (
      error &&
      (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column')) &&
      clientColRetries < 6
    ) {
      clientColRetries++;
      const msg = error.message || '';
      console.warn(`[Client updateEventInSupabase] DB missing column (attempt ${clientColRetries}):`, msg);
      const match =
        msg.match(/'([^']+)' column/) ||
        msg.match(/column "([^"]+)"/i) ||
        msg.match(/column ([a-zA-Z0-9_]+)/i);
      const colName = match ? match[1] : null;
      if (colName && updatePayload[colName] !== undefined) {
        delete updatePayload[colName];
      } else {
        delete updatePayload.allow_external_redirect;
        delete updatePayload.registration_link;
        delete updatePayload.registration_fields;
        delete updatePayload.submissions_enabled;
        delete updatePayload.submission_start_date;
        delete updatePayload.submission_deadline;
      }
      let retryQuery = supabase.from('events').update(updatePayload);
      if (isUuid) retryQuery = retryQuery.eq('id', eventId);
      else retryQuery = retryQuery.eq('slug', eventId);
      const retryRes = await retryQuery;
      error = retryRes.error;
    }

    if (error) {
      console.warn('Direct Supabase update error:', error.message);
      return { success: false, error: error.message };
    }

    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_updated',
        payload: { eventId, updates },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: true };
  }
}

export async function deleteEventInSupabase(
  eventId: string,
  slug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. First try server-side API route (bypasses RLS, handles FK cascades safely)
    if (typeof window !== 'undefined') {
      try {
        const query = new URLSearchParams();
        if (eventId) query.set('eventId', eventId);
        if (slug) query.set('slug', slug);

        const response = await fetch(`/api/events?${query.toString()}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            // Realtime Broadcast
            try {
              const channel = supabase.channel('public:events_realtime');
              channel.send({
                type: 'broadcast',
                event: 'event_deleted',
                payload: { eventId, slug },
              });
            } catch (e) {
              console.warn('Broadcast send error:', e);
            }
            return { success: true };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/events DELETE error, falling back to direct client:', apiErr);
      }
    }

    // 2. Direct client deletion fallback
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let delError = null;

    if (isUuid) {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      delError = error;
    }

    if (delError || !isUuid) {
      const targetSlug = slug || eventId;
      const { error: slugError } = await supabase.from('events').delete().eq('slug', targetSlug);
      if (slugError && delError) {
        return { success: false, error: slugError.message || delError.message };
      }
    }

    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'event_deleted',
        payload: { eventId, slug },
      });
    } catch (e) {
      console.warn('Broadcast send error:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete failed' };
  }
}

/**
 * ─── 5. REGISTRATION OPERATIONS ───────────────────────────────────────────────
 */
export interface RegistrationInput {
  eventId: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  phone?: string;
  college?: string;
  city?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  portfolioUrl?: string;
  resumeUrl?: string;
  discordHandle?: string;
  twitterUrl?: string;
  tshirtSize?: string;
  dietaryPreference?: string;
  experienceLevel?: string;
  customAnswers?: Record<string, string>;
  isTeam?: boolean;
  teamName?: string;
  teamId?: string;
  role?: string;
  status?: 'CONFIRMED' | 'PENDING';
}

export async function checkUserRegistration(
  eventId: string,
  userId?: string | null,
  email?: string
): Promise<{ isRegistered: boolean; registration?: any }> {
  try {
    let targetEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: ev } = await supabase.from('events').select('id').eq('slug', eventId).maybeSingle();
      if (ev?.id) targetEventId = ev.id;
    }

    if (userId) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', targetEventId)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return { isRegistered: true, registration: data };
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', targetEventId)
        .ilike('user_email', cleanEmail)
        .order('registered_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return { isRegistered: true, registration: data };
    }

    return { isRegistered: false };
  } catch {
    return { isRegistered: false };
  }
}

export async function registerForEventSupabase(
  input: RegistrationInput
): Promise<{ success: boolean; error?: string }> {
  // 1. Always save in client storage first so participant & organizer dashboards update immediately
  try {
    registerForEventStorage({
      eventId: input.eventId,
      eventName: (input as any).eventName || 'Hackathon Arena',
      registeredAt: new Date().toISOString(),
      teamName: input.teamName,
      isTeam: Boolean(input.isTeam),
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: (input.status as any) || 'CONFIRMED',
    });

    saveEventRegistration({
      id: `reg_${Date.now()}`,
      eventId: input.eventId,
      userId: input.userId || 'usr_builder',
      userName: input.userName,
      userEmail: input.userEmail,
      phone: input.phone || undefined,
      college: input.college || undefined,
      city: input.city || undefined,
      githubUrl: input.githubUrl || undefined,
      linkedinUrl: input.linkedinUrl || undefined,
      skills: input.skills || [],
      portfolioUrl: input.portfolioUrl || undefined,
      resumeUrl: input.resumeUrl || undefined,
      discordHandle: input.discordHandle || undefined,
      twitterUrl: input.twitterUrl || undefined,
      tshirtSize: input.tshirtSize || undefined,
      dietaryPreference: input.dietaryPreference || undefined,
      experienceLevel: input.experienceLevel || undefined,
      customAnswers: input.customAnswers || {},
      isTeam: Boolean(input.isTeam),
      teamName: input.teamName,
      role: input.role,
      status: input.status === 'PENDING' ? 'PENDING' : 'CONFIRMED',
      registeredAt: new Date().toISOString(),
    });
  } catch (localErr) {
    console.warn('Local registration cache notice:', localErr);
  }

  // If this is a custom client-hosted event, finish successfully immediately
  if (input.eventId && input.eventId.startsWith('evt_custom_')) {
    return { success: true };
  }

  try {
    // 2. Try server API route for database sync
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/registrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            // Realtime Broadcast registration to update counters everywhere
            try {
              const channel = supabase.channel('public:events_realtime');
              channel.send({
                type: 'broadcast',
                event: 'registration_created',
                payload: { eventId: input.eventId, userEmail: input.userEmail },
              });
            } catch (e) {
              console.warn('Broadcast registration error:', e);
            }

            return { success: true };
          } else if (resData.error) {
            return { success: false, error: resData.error };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          if (errData?.error) {
            return { success: false, error: errData.error };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/registrations error, falling back to direct client:', apiErr);
      }
    }

    // 2. Direct client fallback
    // Check if already registered
    const { isRegistered } = await checkUserRegistration(input.eventId, input.userId, input.userEmail);
    if (isRegistered) {
      return { success: false, error: 'You are already registered for this event.' };
    }

    const packedCustomAnswers: Record<string, string> = {
      ...(input.customAnswers || {}),
      ...(input.portfolioUrl ? { portfolioUrl: input.portfolioUrl, portfolio_url: input.portfolioUrl } : {}),
      ...(input.resumeUrl ? { resumeUrl: input.resumeUrl, resume_url: input.resumeUrl } : {}),
      ...(input.discordHandle ? { discordHandle: input.discordHandle, discord_handle: input.discordHandle } : {}),
      ...(input.twitterUrl ? { twitterUrl: input.twitterUrl, twitter_url: input.twitterUrl } : {}),
      ...(input.tshirtSize ? { tshirtSize: input.tshirtSize, tshirt_size: input.tshirtSize } : {}),
      ...(input.dietaryPreference ? { dietaryPreference: input.dietaryPreference, dietary_preference: input.dietaryPreference } : {}),
      ...(input.experienceLevel ? { experienceLevel: input.experienceLevel, experience_level: input.experienceLevel } : {}),
    };

    const payload: any = {
      event_id: input.eventId,
      user_id: input.userId || null,
      user_name: input.userName,
      user_email: input.userEmail,
      phone: input.phone || null,
      college: input.college || null,
      city: input.city || null,
      github_url: input.githubUrl || null,
      linkedin_url: input.linkedinUrl || null,
      skills: input.skills || [],
      custom_answers: packedCustomAnswers,
      is_team: Boolean(input.isTeam),
      team_name: input.teamName || null,
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: input.status || 'CONFIRMED',
      registered_at: new Date().toISOString(),
      portfolio_url: input.portfolioUrl || null,
      resume_url: input.resumeUrl || null,
      discord_handle: input.discordHandle || null,
      twitter_url: input.twitterUrl || null,
      tshirt_size: input.tshirtSize || null,
      dietary_preference: input.dietaryPreference || null,
      experience_level: input.experienceLevel || null,
    };

    let { error } = await supabase.from('registrations').insert(payload);

    // Resilient fallback: If database schema lacks new columns (code 42703)
    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      console.warn('DB missing extended columns in registrations, saving in custom_answers JSONB');
      delete payload.portfolio_url;
      delete payload.resume_url;
      delete payload.discord_handle;
      delete payload.twitter_url;
      delete payload.tshirt_size;
      delete payload.dietary_preference;
      delete payload.experience_level;
      const retryRes = await supabase.from('registrations').insert(payload);
      error = retryRes.error;
    }

    if (error) {
      console.warn('Supabase registration error:', error.message);
      return { success: false, error: error.message };
    }

    // Realtime Broadcast registration to update counters everywhere
    try {
      const channel = supabase.channel('public:events_realtime');
      channel.send({
        type: 'broadcast',
        event: 'registration_created',
        payload: { eventId: input.eventId, userEmail: input.userEmail },
      });
    } catch (e) {
      console.warn('Broadcast registration error:', e);
    }

    // Notify the event host/organizer ONLY about the new registration
    sendOrganizerAlertNotification({
      eventId: input.eventId,
      title: 'New Registration',
      message: `${input.userName || 'A builder'} (${input.userEmail}) has registered for the event.`,
      type: NotificationDbType.REGISTRATION,
      icon: 'sparkles',
      senderId: input.userId,
      metadata: {
        registrantName: input.userName,
        registrantEmail: input.userEmail,
        isTeam: Boolean(input.isTeam),
        teamName: input.teamName,
      },
    }).catch((e) => console.warn('Host registration alert notice:', e));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}

export async function fetchEventRegistrations(eventId: string): Promise<any[]> {
  try {
    if (!eventId || eventId.startsWith('evt_custom_')) {
      return [];
    }

    let targetId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: ev } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (ev?.id) {
        targetId = ev.id;
      } else {
        return [];
      }
    }

    let data: any[] | null = null;
    try {
      const fetchPromise = supabase
        .from('registrations')
        .select('*')
        .eq('event_id', targetId)
        .order('registered_at', { ascending: false });

      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: 'timeout' }), 3000)
      );

      const res = (await Promise.race([fetchPromise, timeoutPromise])) as any;
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        data = res.data;
      }
    } catch {}

    // Fallback: If direct query returned empty/null or timed out, fetch from server API
    if (!data || data.length === 0) {
      try {
        if (typeof window !== 'undefined') {
          const apiRes = await fetch(`/api/registrations?eventId=${encodeURIComponent(targetId)}&list=true`);
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && Array.isArray(json.registrations)) {
              data = json.registrations;
            }
          }
        }
      } catch {}
    }

    return data || [];
  } catch {
    return [];
  }
}

export async function fetchUserRegistrations(userId: string): Promise<any[]> {
  try {
    if (!userId) return [];
    let rows: any[] = [];

    // 1. Try server-side same-origin API FIRST (fast ~30ms, zero CORS issues)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/registrations?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.registrations)) {
            rows = json.registrations;
          }
        }
      } catch (apiErr) {
        console.warn('API fetchUserRegistrations error, falling back:', apiErr);
      }
    }

    // 2. Direct Supabase fallback
    if (rows.length === 0) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*, events(*)')
          .eq('user_id', userId)
          .order('registered_at', { ascending: false });

        if (!error && data && data.length > 0) {
          rows = data;
        }
      } catch (supaErr) {
        console.warn('Direct Supabase fetchUserRegistrations notice:', supaErr);
      }
    }

    return rows;
  } catch {
    return [];
  }
}

/**
 * ─── 5.5 BOOKMARK OPERATIONS ──────────────────────────────────────────────────
 */
export async function fetchUserBookmarks(userId: string): Promise<string[]> {
  try {
    if (!userId) return [];
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) return [];

    const { data, error } = await supabase
      .from('bookmarks')
      .select('event_id, events(slug)')
      .eq('user_id', userId);

    if (error || !data) {
      console.warn('fetchUserBookmarks error:', error?.message);
      return [];
    }

    const ids: string[] = [];
    data.forEach((row: any) => {
      if (row.event_id) ids.push(row.event_id);
      if (row.events?.slug) ids.push(row.events.slug);
    });

    return Array.from(new Set(ids));
  } catch (err) {
    console.warn('fetchUserBookmarks exception:', err);
    return [];
  }
}

export async function toggleBookmarkInSupabase(
  userId: string,
  eventIdOrSlug: string
): Promise<{ isBookmarked: boolean; error?: string }> {
  try {
    if (!userId) return { isBookmarked: false, error: 'User not authenticated' };
    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUserUuid) return { isBookmarked: false, error: 'Invalid user ID' };

    let targetEventId = eventIdOrSlug;
    const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);

    // If not a UUID, resolve event UUID by slug
    if (!isEventUuid) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventIdOrSlug)
        .maybeSingle();

      if (eventData?.id) {
        targetEventId = eventData.id;
      } else {
        return { isBookmarked: false, error: 'Event not found in database' };
      }
    }

    // Check if bookmark already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', targetEventId)
      .maybeSingle();

    if (existing) {
      // Delete bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.warn('Delete bookmark error:', deleteError.message);
        return { isBookmarked: true, error: deleteError.message };
      }
      return { isBookmarked: false };
    } else {
      // Ensure user profile exists in profiles table before inserting bookmark
      try {
        await supabase.from('profiles').upsert(
          { id: userId, updated_at: new Date().toISOString() },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch (e) {
        console.warn('Profile ensure before bookmark:', e);
      }

      // Insert bookmark
      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          event_id: targetEventId,
        });

      if (insertError) {
        console.warn('Insert bookmark error:', insertError.message);
        return { isBookmarked: false, error: insertError.message };
      }
      return { isBookmarked: true };
    }
  } catch (err: any) {
    console.warn('toggleBookmarkInSupabase exception:', err);
    return { isBookmarked: false, error: err.message || 'Bookmark toggle failed' };
  }
}

/**
 * ─── 6. TEAMS & SQUADS OPERATIONS ─────────────────────────────────────────────
 */
export async function createTeamSupabase(
  eventId: string,
  leaderId: string,
  teamName: string,
  maxMembers: number = 4,
  description?: string,
  leaderDetails?: {
    name?: string;
    email?: string;
    phone?: string | null;
    college?: string | null;
    skills?: string[];
  }
): Promise<{ success: boolean; team?: any; error?: string }> {
  // Check if event is a custom local event or non-UUID
  const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  const isLeaderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaderId);

  if (!isEventUuid || eventId.startsWith('evt_custom_') || !isLeaderUuid) {
    const localTeam = {
      id: `team_${Date.now()}`,
      event_id: eventId,
      name: teamName,
      leader_id: leaderId,
      max_members: maxMembers,
      description: description || '',
      created_at: new Date().toISOString(),
      profiles: {
        name: leaderDetails?.name || 'Squad Leader',
        email: leaderDetails?.email || 'leader@hackersunity.dev',
      },
      team_members: [
        {
          id: `member_${Date.now()}`,
          team_id: `team_${Date.now()}`,
          user_id: leaderId,
          role: 'LEADER',
          status: 'ACCEPTED',
          profiles: {
            name: leaderDetails?.name || 'Squad Leader',
            email: leaderDetails?.email || 'leader@hackersunity.dev',
          },
        },
      ],
    };
    saveLocalEventTeam(eventId, localTeam);
    return { success: true, team: localTeam };
  }

  try {
    // 1. Try server API route first (handles RLS bypass and profile ensuring)
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            eventId,
            leaderId,
            teamName,
            maxMembers,
            description,
            leaderName: leaderDetails?.name,
            leaderEmail: leaderDetails?.email,
            phone: leaderDetails?.phone,
            college: leaderDetails?.college,
            skills: leaderDetails?.skills,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.team) {
            return { success: true, team: resData.team };
          } else if (resData.error) {
            return { success: false, error: resData.error };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          if (errData?.error) {
            return { success: false, error: errData.error };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/teams create error, falling back to direct client:', apiErr);
      }
    }

    // 2. Direct client fallback: ensure leader profile exists to avoid teams_leader_id_fkey violation
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', leaderId)
        .maybeSingle();

      if (!prof) {
        await supabase.from('profiles').upsert(
          {
            id: leaderId,
            name: leaderDetails?.name || 'Squad Leader',
            email: leaderDetails?.email || '',
            phone: leaderDetails?.phone || null,
            college: leaderDetails?.college || null,
            skills: leaderDetails?.skills || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (profErr) {
      console.warn('Profile ensure before team creation warning:', profErr);
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        event_id: eventId,
        leader_id: leaderId,
        max_members: maxMembers,
        description: description || '',
      })
      .select('*')
      .single();

    if (teamError || !team) {
      return { success: false, error: teamError?.message || 'Failed to create team' };
    }

    try {
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: leaderId,
        role: 'LEADER',
        status: 'ACCEPTED',
      });
    } catch (e) {
      console.warn('team_members table insert non-fatal:', e);
    }

    return { success: true, team };
  } catch (err: any) {
    return { success: false, error: err.message || 'Team creation failed' };
  }
}

export async function fetchEventTeams(eventId: string): Promise<any[]> {
  const localTeams = getLocalEventTeams(eventId);
  const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isEventUuid || eventId.startsWith('evt_custom_')) {
    return localTeams;
  }
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url))')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error || !data) return localTeams;
    return [...data, ...localTeams];
  } catch {
    return localTeams;
  }
}

export async function joinTeamSupabase(
  teamId: string,
  userId: string,
  maxMembers: number = 4,
  userDetails?: {
    name?: string;
    email?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (teamId.startsWith('team_')) {
    const member = {
      id: `member_${Date.now()}`,
      team_id: teamId,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
      profiles: {
        name: userDetails?.name || 'Squad Member',
        email: userDetails?.email || 'member@hackersunity.dev',
      },
    };
    const success = joinLocalEventTeam('', teamId, member);
    return success
      ? { success: true }
      : { success: false, error: 'Failed to join team or team is full' };
  }

  try {
    // 1. Try server API route first (runs with admin client and bypasses RLS)
    if (typeof window !== 'undefined') {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/teams', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            action: 'join',
            teamId,
            userId,
            maxMembers,
            userName: userDetails?.name,
            userEmail: userDetails?.email,
          }),
        });

        let resData: any = {};
        try {
          resData = await response.json();
        } catch {
          // ignore json parse error
        }

        if (response.ok && resData.success) {
          return { success: true };
        }
        if (resData.error || resData.message || !response.ok) {
          return {
            success: false,
            error: resData.error || resData.message || `Server error (${response.status}) joining squad`,
          };
        }
      } catch (apiErr: any) {
        console.warn('API /api/teams join error, falling back:', apiErr);
      }
    }

    // 2. Direct client fallback: ensure member profile exists to avoid team_members_user_id_fkey
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!prof) {
        await supabase.from('profiles').upsert(
          {
            id: userId,
            name: userDetails?.name || 'Squad Member',
            email: userDetails?.email || '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      }
    } catch (profErr) {
      console.warn('Profile ensure before join warning:', profErr);
    }

    const { data: teamData } = await supabase
      .from('teams')
      .select('id, leader_id, max_members, team_members(id, user_id)')
      .eq('id', teamId)
      .maybeSingle();

    if (teamData) {
      const uniqueMemberIds = new Set<string>();
      if (teamData.leader_id) uniqueMemberIds.add(teamData.leader_id);
      if (Array.isArray(teamData.team_members)) {
        teamData.team_members.forEach((m: any) => {
          if (m?.user_id) uniqueMemberIds.add(m.user_id);
        });
      }
      const count = uniqueMemberIds.size > 0 ? uniqueMemberIds.size : (teamData.team_members?.length || 0);
      const effectiveMax = teamData.max_members || maxMembers || 4;
      if (count >= effectiveMax) {
        return { success: false, error: `This squad has already reached its maximum capacity of ${effectiveMax} members.` };
      }
    }

    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to join team' };
  }
}

/**
 * ─── 6.45 TEAM JOIN REQUESTS (LEADER APPROVAL WORKFLOW) ────────────────────────
 */

export async function requestJoinTeamSupabase(
  teamId: string,
  userId: string,
  details?: {
    name?: string;
    email?: string;
    phone?: string;
    college?: string;
    city?: string;
    skills?: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    message?: string;
    customAnswers?: any;
  }
): Promise<{ success: boolean; requestId?: string; message?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'request_join',
        teamId,
        userId,
        userName: details?.name,
        userEmail: details?.email,
        phone: details?.phone,
        college: details?.college,
        city: details?.city,
        skills: details?.skills,
        githubUrl: details?.githubUrl,
        linkedinUrl: details?.linkedinUrl,
        customAnswers: details?.customAnswers,
        message: details?.message,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hackers_unity_storage_change'));
      }
      return { success: true, requestId: data.requestId, message: data.message };
    }

    return {
      success: false,
      error: data.error || data.message || `Error (${res.status}) sending join request`,
    };
  } catch (err: any) {
    console.error('requestJoinTeamSupabase error:', err);
    return { success: false, error: err.message || 'Failed to send join request' };
  }
}

export async function fetchTeamJoinRequestsSupabase(
  teamId: string
): Promise<{ success: boolean; requests: any[]; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/teams?action=get_join_requests&teamId=${encodeURIComponent(teamId)}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true, requests: data.requests || [] };
    }

    return { success: false, requests: [], error: data.error || 'Failed to fetch join requests' };
  } catch (err: any) {
    console.warn('fetchTeamJoinRequestsSupabase error:', err);
    return { success: false, requests: [], error: err.message };
  }
}

export async function approveTeamJoinRequestSupabase(
  teamId: string,
  requestId: string,
  requesterId: string,
  requesterDetails?: { name?: string; email?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'approve_join_request',
        teamId,
        requestId,
        requesterId,
        requesterName: requesterDetails?.name,
        requesterEmail: requesterDetails?.email,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hackers_unity_storage_change'));
      }
      return { success: true, message: data.message };
    }

    return { success: false, error: data.error || 'Failed to approve join request' };
  } catch (err: any) {
    console.error('approveTeamJoinRequestSupabase error:', err);
    return { success: false, error: err.message || 'Failed to approve request' };
  }
}

export async function declineTeamJoinRequestSupabase(
  teamId: string,
  requestId: string,
  requesterId: string,
  requesterEmail?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'decline_join_request',
        teamId,
        requestId,
        requesterId,
        requesterEmail,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hackers_unity_storage_change'));
      }
      return { success: true, message: data.message };
    }

    return { success: false, error: data.error || 'Failed to decline join request' };
  } catch (err: any) {
    console.error('declineTeamJoinRequestSupabase error:', err);
    return { success: false, error: err.message || 'Failed to decline request' };
  }
}

export async function cancelTeamJoinRequestSupabase(
  teamId?: string | null,
  eventId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/teams', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        action: 'cancel_join_request',
        teamId: teamId || null,
        eventId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      if (eventId && typeof window !== 'undefined') {
        removeRegistrationForEvent(eventId);
        window.dispatchEvent(new Event('hackers_unity_storage_change'));
      }
      return { success: true, message: data.message };
    }

    return { success: false, error: data.error || 'Failed to cancel join request' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to cancel request' };
  }
}

export async function fetchUserPendingTeamRequest(
  eventId: string,
  userId: string
): Promise<{ hasPendingRequest: boolean; requestData?: any }> {
  try {
    // 1. Check explicit team_join_requests table first
    try {
      let resolvedEventId = eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (!isUuid) {
        const { data: ev } = await supabase.from('events').select('id').eq('slug', eventId).maybeSingle();
        if (ev?.id) resolvedEventId = ev.id;
      }

      const { data: req } = await supabase
        .from('team_join_requests')
        .select('*, teams(id, name, leader_id, profiles:leader_id(name, email))')
        .or(`event_id.eq.${resolvedEventId},event_id.eq.${eventId}`)
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .maybeSingle();

      if (req) {
        return {
          hasPendingRequest: true,
          requestData: {
            ...req,
            teamId: req.team_id,
            teamName: req.teams?.name || 'Squad',
            leaderName: req.teams?.profiles?.name || 'Squad Leader',
          },
        };
      }
    } catch {}

    // 2. Check registrations table ONLY if it's explicitly marked as a team and NOT solo
    let query = supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (isUuid) {
      query = query.eq('event_id', eventId);
    } else {
      query = query.or(`event_id.eq.${eventId}`);
    }

    const { data: reg } = await query.maybeSingle();

    // MUST be a team registration, with a squad name/id, and role containing pending
    if (
      reg &&
      reg.is_team === true &&
      (reg.team_name || reg.team_id) &&
      reg.role &&
      reg.role.toLowerCase().includes('pending')
    ) {
      return { hasPendingRequest: true, requestData: reg };
    }

    return { hasPendingRequest: false };
  } catch {
    return { hasPendingRequest: false };
  }
}

/**
 * ─── 6.5 TEAM INVITATIONS ─────────────────────────────────────────────────────
 */

/**
 * Send a team invite to an email address
 */
export async function sendTeamInvite(
  teamId: string,
  eventId: string,
  invitedByUserId: string,
  invitedEmail: string
): Promise<{ success: boolean; invite?: any; inviteLink?: string; error?: string }> {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cleanEmail = invitedEmail.toLowerCase().trim();

    // 1. Handle local / custom squads
  if (teamId.startsWith('team_') || eventId.startsWith('evt_custom_')) {
    const token = `inv_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const localTeam = getLocalTeamWithMembers(teamId);
    const teamName = localTeam?.name || 'Squad';

    const localInvite = {
      id: `inv_${Date.now()}`,
      team_id: teamId,
      event_id: eventId,
      invited_by: invitedByUserId,
      invited_email: cleanEmail,
      status: 'PENDING',
      invite_token: token,
      created_at: new Date().toISOString(),
      teams: {
        name: teamName,
      },
      events: {
        slug: eventId,
        title: 'Hackathon Arena',
      },
      profiles: {
        name: 'Squad Leader',
        email: 'leader@hackersunity.dev',
      },
    };
    saveLocalTeamInvite(teamId, localInvite);
    const inviteLink = `${origin}/hackathons/${eventId}/invite?token=${token}`;

    // Realtime broadcast for local / custom squads
    try {
      if (typeof window !== 'undefined') {
        const channel = supabase.channel('realtime-hub-global');
        channel.send({
          type: 'broadcast',
          event: 'team_invite',
          payload: {
            invitedEmail: cleanEmail,
            targetUserId: null,
            teamName,
            hackathonTitle: 'Hackathon Arena',
            hackathonSlug: eventId,
            invitedByName: 'Squad Leader',
            inviteToken: token,
            actionUrl: `/hackathons/${eventId}/invite?token=${token}`,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (e) {
      console.warn('Realtime broadcast warning for local team:', e);
    }

    // Dispatch real email via /api/invite-email!
    try {
      if (typeof window !== 'undefined') {
        const emailRes = await fetch('/api/invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: cleanEmail,
            teamName: teamName,
            hackathonTitle: 'Hackathon Arena',
            hackathonSlug: eventId,
            invitedByName: 'Squad Leader',
            inviteToken: token,
            origin,
          }),
        });
        const resJson = await emailRes.json();
        console.log('[sendTeamInvite - local team] Email dispatch result:', resJson);
      }
    } catch (e) {
      console.warn('Email dispatch warning for local team:', e);
    }

    return { success: true, invite: localInvite, inviteLink };
  }

  try {
    // Check if invite already exists for this email + team
    const { data: existing } = await supabase
      .from('team_invitations')
      .select('id, status, invite_token')
      .eq('team_id', teamId)
      .eq('invited_email', cleanEmail)
      .maybeSingle();

    // Fetch team and event metadata for link and email
    const { data: teamData } = await supabase
      .from('teams')
      .select('name, events(id, title, slug)')
      .eq('id', teamId)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', invitedByUserId)
      .maybeSingle();

    const teamName = teamData?.name || 'Squad';
    const eventSlug = (teamData?.events as any)?.slug || eventId;
    const eventTitle = (teamData?.events as any)?.title || 'Hackathon';
    const inviterName = profileData?.name || 'A teammate';

    let inviteRecord: any = null;

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return { success: false, error: 'This person has already accepted the invite and is on the team.' };
      }
      if (existing.status === 'PENDING') {
        // Already pending, still resend the email
        inviteRecord = existing;
      } else {
        // If DECLINED or EXPIRED, update to PENDING again
        const { data: updated, error: updateErr } = await supabase
          .from('team_invitations')
          .update({
            status: 'PENDING',
            responded_at: null,
            invited_by: invitedByUserId,
          })
          .eq('id', existing.id)
          .select('*')
          .single();

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }
        inviteRecord = updated;
      }
    } else {
      // Create new invite
      const { data: invite, error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          event_id: eventId,
          invited_by: invitedByUserId,
          invited_email: cleanEmail,
          status: 'PENDING',
        })
        .select('*')
        .single();

      if (error || !invite) {
        return { success: false, error: error?.message || 'Failed to create invite' };
      }
      inviteRecord = invite;
    }

    const inviteLink = `${origin}/hackathons/${eventSlug}/invite?token=${inviteRecord.invite_token}`;

    // Cache local invite & trigger local UI update immediately
    try {
      saveLocalTeamInvite(teamId, {
        id: inviteRecord.id,
        team_id: teamId,
        event_id: eventId,
        invited_by: invitedByUserId,
        invited_email: cleanEmail,
        status: 'PENDING',
        invite_token: inviteRecord.invite_token,
        created_at: new Date().toISOString(),
        teams: {
          name: teamName,
        },
        events: {
          slug: eventSlug,
          title: eventTitle,
        },
        profiles: {
          name: inviterName,
        },
      });
    } catch (saveErr) {
      console.warn('Local invite cache notice:', saveErr);
    }

    // 2. Create in-app notification & send realtime alert
    try {
      // Look up target profile by email
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      const isSenderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitedByUserId);
      const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId);

      if (targetProfile?.id) {
        const { data: notifData } = await supabase
          .from('notifications')
          .insert({
            title: `Squad Invite: ${teamName}`,
            message: `${inviterName} invited you to join "${teamName}" for ${eventTitle}!`,
            type: 'team',
            icon: 'users',
            event_id: isEventUuid ? eventId : null,
            sender_id: isSenderUuid ? invitedByUserId : null,
            target_type: 'specific_user',
            action_url: `/hackathons/${eventSlug}/invite?token=${inviteRecord.invite_token}`,
            metadata: {
              inviteToken: inviteRecord.invite_token,
              teamId,
              teamName,
              eventId,
              eventSlug,
              eventTitle,
              invitedByName: inviterName,
              invitedEmail: cleanEmail,
              status: 'PENDING',
            },
          })
          .select('id')
          .single();

        if (notifData?.id) {
          await supabase
            .from('user_notifications')
            .upsert(
              {
                user_id: targetProfile.id,
                notification_id: notifData.id,
                is_read: false,
              },
              { onConflict: 'user_id,notification_id' }
            );
        }
      }

      // Realtime broadcast to online connected clients
      if (typeof window !== 'undefined') {
        const channel = supabase.channel('realtime-hub-global');
        channel.send({
          type: 'broadcast',
          event: 'team_invite',
          payload: {
            invitedEmail: cleanEmail,
            targetUserId: targetProfile?.id || null,
            teamName,
            hackathonTitle: eventTitle,
            hackathonSlug: eventSlug,
            invitedByName: inviterName,
            inviteToken: inviteRecord.invite_token,
            actionUrl: `/hackathons/${eventSlug}/invite?token=${inviteRecord.invite_token}`,
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch (notifErr) {
      console.warn('In-app notification dispatch notice:', notifErr);
    }

    // Dispatch email via API route
    try {
      if (typeof window !== 'undefined') {
        const emailRes = await fetch('/api/invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: cleanEmail,
            teamName,
            hackathonTitle: eventTitle,
            hackathonSlug: eventSlug,
            invitedByName: inviterName,
            inviteToken: inviteRecord.invite_token,
            origin,
          }),
        });
        const resJson = await emailRes.json();
        console.log('[sendTeamInvite] Email dispatch result:', resJson);
      }
    } catch (e) {
      console.warn('Could not trigger invite email:', e);
    }

    return { success: true, invite: inviteRecord, inviteLink };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send invite' };
  }
}

/**
 * Fetch all invites for a specific team (leader view)
 */
export async function fetchTeamInvites(teamId: string): Promise<any[]> {
  const localInvites = getLocalTeamInvites(teamId);
  if (teamId.startsWith('team_')) {
    return localInvites;
  }
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, profiles:invited_by(name, email, avatar_url)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error || !data) return localInvites;
    return [...data, ...localInvites];
  } catch {
    return localInvites;
  }
}

/**
 * Fetch all pending invites for a user by their email
 */
export async function fetchPendingInvitesForUser(email: string): Promise<any[]> {
  try {
    if (!email) return [];
    const cleanEmail = email.toLowerCase().trim();
    const { data } = await supabase
      .from('team_invitations')
      .select('*, teams(id, name, event_id, leader_id, description, profiles:leader_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), profiles:invited_by(name, email)')
      .ilike('invited_email', cleanEmail)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    const localPending = getLocalPendingInvitesForEmail(cleanEmail);
    const merged = [...(data || []), ...localPending];

    const seen = new Set<string>();
    return merged.filter((inv) => {
      const key = inv.invite_token || inv.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return getLocalPendingInvitesForEmail(email);
  }
}

/**
 * Get invite details by token (for the accept page)
 */
export async function getInviteByToken(token: string): Promise<{ invite: any | null; error?: string }> {
  // 1. Check local storage first
  const local = getLocalInviteByToken(token);
  if (local) return { invite: local };

  // 2. Try Supabase
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, teams(id, name, event_id, leader_id, description, max_members, profiles:leader_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date, banner_url, location)')
      .eq('invite_token', token)
      .maybeSingle();

    if (data) {
      return { invite: data };
    }
  } catch (err: any) {
    console.warn('Remote invite fetch error, falling back:', err);
  }

  // 3. Fallback for demo / custom / test tokens
  const fallbackInvite = {
    id: `inv_${token}`,
    invite_token: token,
    status: 'PENDING',
    invited_email: 'teammate@example.com',
    created_at: new Date().toISOString(),
    teams: {
      id: 'team_squad',
      name: 'hacker',
      max_members: 4,
      leader_id: 'usr_leader',
      profiles: {
        name: 'Squad Leader',
        email: 'leader@hackersunity.dev',
      },
      team_members: [],
    },
    events: {
      id: 'codewars',
      slug: 'codewars',
      title: 'CodeWars 3.0',
      start_date: '2026-08-22T00:00:00Z',
      end_date: '2026-08-24T23:59:59Z',
      location: 'Bangalore, India',
    },
  };

  return { invite: fallbackInvite };
}

/**
 * Accept a team invite by token
 */
export async function acceptTeamInvite(
  inviteToken: string,
  userId: string
): Promise<{ success: boolean; teamId?: string; eventSlug?: string; error?: string }> {
  // 1. Handle local invite if token matches
  const localInvite = getLocalInviteByToken(inviteToken);
  if (localInvite) {
    if (localInvite.status !== 'PENDING') {
      return { success: false, error: `This invite has already been ${localInvite.status.toLowerCase()}.` };
    }
    updateLocalInviteStatus(inviteToken, 'ACCEPTED');
    joinLocalEventTeam(localInvite.event_id, localInvite.team_id, {
      id: `mem_${Date.now()}`,
      team_id: localInvite.team_id,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
      profiles: {
        name: 'Teammate',
        email: localInvite.invited_email,
      },
    });
    return { success: true, teamId: localInvite.team_id, eventSlug: localInvite.event_id };
  }

  try {
    // 2. Get the invite from Supabase
    const { invite, error: fetchErr } = await getInviteByToken(inviteToken);
    if (fetchErr || !invite) {
      return { success: false, error: fetchErr || 'Invite not found.' };
    }

    if (invite.status !== 'PENDING') {
      return { success: false, error: `This invite has already been ${invite.status.toLowerCase()}.` };
    }

    const team = invite.teams;
    if (!team) {
      return { success: false, error: 'Team not found.' };
    }

    // 3. Check team capacity
    const uniqueMemberIds = new Set<string>();
    if (team.leader_id) uniqueMemberIds.add(team.leader_id);
    if (Array.isArray(team.team_members)) {
      team.team_members.forEach((m: any) => {
        if (m?.user_id) uniqueMemberIds.add(m.user_id);
      });
    }
    const currentMembers = uniqueMemberIds.size > 0 ? uniqueMemberIds.size : (team.team_members?.length || 0);
    const maxMembers = team.max_members || 4;
    if (currentMembers >= maxMembers) {
      return { success: false, error: `This squad has already reached its maximum capacity of ${maxMembers} members.` };
    }

    // 4. Update invite status to ACCEPTED
    try {
      await supabase
        .from('team_invitations')
        .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
        .eq('invite_token', inviteToken);
    } catch {
      // ignore
    }

    // 5. Add user to team_members
    if (userId && team.id) {
      try {
        await supabase
          .from('team_members')
          .upsert(
            {
              team_id: team.id,
              user_id: userId,
              role: 'MEMBER',
              status: 'ACCEPTED',
            },
            { onConflict: 'team_id,user_id' }
          );
      } catch (memErr) {
        console.warn('Could not upsert team_member:', memErr);
      }
    }

    // 6. Update local invite status if cached
    updateLocalInviteStatus(inviteToken, 'ACCEPTED');

    // 7. Notify team leader
    try {
      if (team.leader_id && team.leader_id !== userId) {
        const { data: acceptingProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .maybeSingle();
        const userName = acceptingProfile?.name || 'A teammate';

        await sendNotificationToUser(
          team.leader_id,
          `Squad Update: ${team.name}`,
          `${userName} has accepted your invite and joined ${team.name}!`,
          NotificationDbType.TEAM,
          {
            icon: 'users',
            eventId: team.event_id || undefined,
            actionUrl: `/hackathons/${invite.events?.slug || 'event'}/register`,
          }
        );
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hackers_unity_storage_change'));
    }

    return {
      success: true,
      teamId: team.id || 'team_joined',
      eventSlug: invite.events?.slug || 'codewars',
    };
  } catch (err: any) {
    return { success: true, teamId: 'team_joined', eventSlug: 'codewars' };
  }
}

/**
 * Decline a team invite by token
 */
export async function declineTeamInvite(
  inviteToken: string
): Promise<{ success: boolean; error?: string }> {
  updateLocalInviteStatus(inviteToken, 'DECLINED');

  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
      .eq('invite_token', inviteToken)
      .eq('status', 'PENDING');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hackers_unity_storage_change'));
    }

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('hackers_unity_storage_change'));
    }
    return { success: false, error: err.message || 'Failed to decline invite' };
  }
}

/**
 * Leave a team (remove self from team_members)
 */
export async function leaveTeam(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is leader — leaders can't leave (must delete team)
    const { data: team } = await supabase
      .from('teams')
      .select('leader_id')
      .eq('id', teamId)
      .maybeSingle();

    if (team?.leader_id === userId) {
      return { success: false, error: 'Team leaders cannot leave their own team. Delete the team instead.' };
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) return { success: false, error: error.message };

    // Also update any corresponding invite
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (userProfile?.email) {
      await supabase
        .from('team_invitations')
        .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('invited_email', userProfile.email);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to leave team' };
  }
}

/**
 * Delete an entire team (Squad Leader Only)
 */
export async function deleteTeamSupabase(
  teamId: string,
  userId: string,
  eventId?: string
): Promise<{ success: boolean; error?: string }> {
  deleteLocalTeam(teamId);
  if (eventId) {
    removeRegistrationForEvent(eventId);
  }

  if (teamId.startsWith('team_')) {
    return { success: true };
  }

  try {
    if (!teamId || !userId) {
      return { success: false, error: 'Team ID and user ID are required' };
    }

    // 1. Try server API route first
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(`/api/teams?teamId=${encodeURIComponent(teamId)}&userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            deleteLocalTeam(teamId);
            if (eventId) removeRegistrationForEvent(eventId);
            return { success: true };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/teams DELETE error, falling back:', apiErr);
      }
    }

    // 2. Direct client fallback
    const { data: team, error: fetchErr } = await supabase
      .from('teams')
      .select('id, name, leader_id, event_id')
      .eq('id', teamId)
      .maybeSingle();

    if (fetchErr || !team) {
      deleteLocalTeam(teamId);
      if (eventId) removeRegistrationForEvent(eventId);
      return { success: true };
    }

    if (team.leader_id !== userId) {
      return { success: false, error: 'Only the squad leader can delete this team.' };
    }

    // Delete team_invitations for this team
    try {
      await supabase.from('team_invitations').delete().eq('team_id', teamId);
    } catch (e) {
      console.warn('team_invitations delete error:', e);
    }

    // Delete team_members for this team
    try {
      await supabase.from('team_members').delete().eq('team_id', teamId);
    } catch (e) {
      console.warn('team_members delete error:', e);
    }

    // Delete the team itself
    const { error: deleteErr } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }

    // Clean up leader's and team's registrations
    try {
      if (team.event_id) {
        await supabase
          .from('registrations')
          .delete()
          .eq('event_id', team.event_id)
          .eq('user_id', userId);

        if (team.name) {
          await supabase
            .from('registrations')
            .delete()
            .eq('event_id', team.event_id)
            .eq('team_name', team.name);
        }
        removeRegistrationForEvent(team.event_id);
      }
    } catch (e) {
      console.warn('registrations delete error:', e);
    }

    deleteLocalTeam(teamId);
    if (eventId) removeRegistrationForEvent(eventId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete squad' };
  }
}

/**
 * Remove a member from a team (Squad Leader Only)
 */
export async function removeTeamMemberSupabase(
  teamId: string,
  memberUserId: string,
  leaderUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (teamId.startsWith('team_')) {
    removeMemberFromLocalTeam(teamId, memberUserId);
    return { success: true };
  }

  try {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove_member',
            teamId,
            memberUserId,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            removeMemberFromLocalTeam(teamId, memberUserId);
            return { success: true };
          } else if (resData.error) {
            return { success: false, error: resData.error };
          }
        }
      } catch (e) {
        console.warn('API /api/teams remove_member notice, falling back:', e);
      }
    }

    // Direct client fallback
    const { data: team } = await supabase
      .from('teams')
      .select('id, leader_id, event_id')
      .eq('id', teamId)
      .single();

    if (!team || team.leader_id !== leaderUserId) {
      return { success: false, error: 'Only the squad leader can remove members.' };
    }

    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberUserId);

    if (team.event_id) {
      await supabase
        .from('registrations')
        .delete()
        .eq('event_id', team.event_id)
        .eq('user_id', memberUserId);
    }

    removeMemberFromLocalTeam(teamId, memberUserId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove member' };
  }
}

/**
 * Fetch team by unique invitation code or link
 */
export async function fetchTeamByInviteCode(
  eventSlugOrId: string,
  inviteCode: string
): Promise<{ success: boolean; team?: any; error?: string }> {
  try {
    const code = inviteCode.trim();
    if (!code) {
      return { success: false, error: 'Invitation code or link is required.' };
    }

    // 1. Try server API route first
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/teams?inviteCode=${encodeURIComponent(code)}`);
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.team) {
            return { success: true, team: resData.team };
          }
        }
      } catch (e) {
        console.warn('API /api/teams GET error, fallback to direct:', e);
      }
    }

    // 2. Direct client fallback via team_invitations
    const { data: inv } = await supabase
      .from('team_invitations')
      .select('invite_token, team_id, teams(*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date))')
      .ilike('invite_token', code)
      .maybeSingle();

    if (inv?.teams) {
      return { success: true, team: { ...inv.teams, invite_token: inv.invite_token } };
    }

    // 3. Fallback check by team name
    const { data: teamByName } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(invite_token)')
      .ilike('name', code)
      .maybeSingle();

    if (teamByName) {
      const token = (teamByName.team_invitations as any[])?.[0]?.invite_token || code;
      return { success: true, team: { ...teamByName, invite_token: token } };
    }

    // 4. Local storage fallback
    const localTeams = getLocalEventTeams(eventSlugOrId);
    const local = localTeams.find(
      (t) => t.name.toLowerCase() === code.toLowerCase() || t.id === code
    );
    if (local) {
      return { success: true, team: local };
    }

    return { success: false, error: 'No squad found matching this invitation link or code.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to find squad' };
  }
}

/**
 * Fetch full team details with all members (for team view)
 */
export async function fetchTeamWithMembers(teamId: string): Promise<any | null> {
  const local = getLocalTeamWithMembers(teamId);
  if (teamId.startsWith('team_') || local) {
    return local;
  }

  // 1. Try server API route first (runs with admin privileges, bypasses RLS and includes full profiles)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/teams?teamId=${encodeURIComponent(teamId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.team) {
          return json.team;
        }
      }
    } catch (e) {
      console.warn('API /api/teams GET teamId error, fallback to client Supabase:', e);
    }
  }

  // 2. Direct client fallback
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url, phone, college, skills)), team_invitations(id, invited_email, status, created_at, invite_token)')
      .eq('id', teamId)
      .maybeSingle();

    if (error || !data) return local;
    const inviteToken =
      data.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
      (data.team_invitations as any[])?.[0]?.invite_token ||
      data.name;
    return { ...data, invite_token: inviteToken };
  } catch {
    return local;
  }
}

/**
 * Fetch all teams a user is part of (for dashboard)
 */
export async function fetchUserTeams(userId: string): Promise<any[]> {
  try {
    if (!userId) return [];

    // 1. Get team IDs where user is in team_members
    const { data: memberRows } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    const memberTeamIds = memberRows ? memberRows.map((r: any) => r.team_id) : [];

    // 2. Also get teams where user is leader
    const { data: leaderTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('leader_id', userId);

    const leaderTeamIds = leaderTeams ? leaderTeams.map((r: any) => r.id) : [];

    const allTeamIds = Array.from(new Set([...memberTeamIds, ...leaderTeamIds]));

    if (allTeamIds.length === 0) return [];

    // Fetch full team details
    const { data: teams, error: teamErr } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url, phone, college, skills)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at, invite_token)')
      .in('id', allTeamIds)
      .order('created_at', { ascending: false });

    if (teamErr || !teams) return [];
    return teams;
  } catch {
    return [];
  }
}

/**
 * Fetch a specific team for an event where the user is a leader or member
 */
export async function fetchUserTeamForEvent(eventId: string, userId: string): Promise<any | null> {
  const localTeams = getLocalEventTeams(eventId);
  const foundLocal = localTeams.find(
    (t) => t.leader_id === userId || t.team_members?.some((m: any) => m.user_id === userId)
  );
  if (foundLocal) return foundLocal;

  if (!eventId || !userId) return null;
  if (eventId.startsWith('evt_custom_')) return null;

  // 1. Try server API route first (runs with admin privileges, bypasses RLS and handles multiple teams cleanly)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(
        `/api/teams?action=get_user_team&eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(userId)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.team) {
          return json.team;
        }
      }
    } catch (apiErr) {
      console.warn('API /api/teams get_user_team error, fallback to client Supabase:', apiErr);
    }
  }

  // 2. Client fallback
  let resolvedEventId = eventId;
  const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isEventUuid) {
    const { data: ev } = await supabase
      .from('events')
      .select('id')
      .eq('slug', eventId)
      .maybeSingle();
    if (ev?.id) {
      resolvedEventId = ev.id;
    } else {
      return null;
    }
  }

  try {
    // Check if leader - safely order by created_at desc without maybeSingle crashing
    const { data: leaderTeams } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url, phone, college, skills)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at, invite_token)')
      .eq('event_id', resolvedEventId)
      .eq('leader_id', userId)
      .order('created_at', { ascending: false });

    if (leaderTeams && leaderTeams.length > 0) {
      // Pick team with most members, or the most recent
      const sortedTeams = [...leaderTeams].sort((a, b) => {
        const countA = a.team_members?.length || 0;
        const countB = b.team_members?.length || 0;
        if (countB !== countA) return countB - countA;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      const leaderTeam = sortedTeams[0];
      const inviteToken =
        leaderTeam.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
        (leaderTeam.team_invitations as any[])?.[0]?.invite_token ||
        leaderTeam.name;
      return { ...leaderTeam, invite_token: inviteToken };
    }

    // Check if member
    const { data: memberRows } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memberRows && memberRows.length > 0) {
      const teamIds = memberRows.map((m: any) => m.team_id);
      const { data: memberTeams } = await supabase
        .from('teams')
        .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url, phone, college, skills)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at, invite_token)')
        .eq('event_id', resolvedEventId)
        .in('id', teamIds)
        .order('created_at', { ascending: false });

      if (memberTeams && memberTeams.length > 0) {
        const sortedMemberTeams = [...memberTeams].sort((a, b) => {
          const countA = a.team_members?.length || 0;
          const countB = b.team_members?.length || 0;
          if (countB !== countA) return countB - countA;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        const memberTeam = sortedMemberTeams[0];
        const inviteToken =
          memberTeam.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
          (memberTeam.team_invitations as any[])?.[0]?.invite_token ||
          memberTeam.name;
        return { ...memberTeam, invite_token: inviteToken };
      }
    }

    return null;
  } catch (err) {
    console.warn('fetchUserTeamForEvent error:', err);
    return null;
  }
}

/**
 * ─── 7. REALTIME SUBSCRIPTION HELPERS ─────────────────────────────────────────
 */
export function subscribeToPublishedEvents(onEventChange: (payload?: any) => void): () => void {
  try {
    // Remove any existing channel with the same name first to prevent
    // "cannot add callbacks after subscribe()" errors on React StrictMode re-mounts
    const channelName = 'public:events_realtime';
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      // Listen to instant client-to-client Broadcasts
      .on('broadcast', { event: 'event_created' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'event_updated' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'event_deleted' }, (payload) => {
        onEventChange(payload);
      })
      .on('broadcast', { event: 'registration_created' }, (payload) => {
        onEventChange(payload);
      })
      // Listen to direct Postgres DB changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          onEventChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          onEventChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription error:', e);
    return () => {};
  }
}

export function subscribeToEventDetails(
  eventIdOrSlug: string,
  onUpdate: (payload?: any) => void
): () => void {
  try {
    const channelName = `public:event_${eventIdOrSlug}`;
    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(channelName)
      // Broadcast events
      .on('broadcast', { event: 'event_updated' }, (payload) => {
        onUpdate(payload);
      })
      .on('broadcast', { event: 'registration_created' }, (payload) => {
        onUpdate(payload);
      })
      .on('broadcast', { event: 'team_created' }, (payload) => {
        onUpdate(payload);
      })
      // Postgres changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    // Also listen on public:events_realtime channel for broadcast updates
    const globalChannelName = `public:events_realtime_${eventIdOrSlug}`;
    const globalChannel = supabase
      .channel(globalChannelName)
      .on('broadcast', { event: 'registration_created' }, (payload) => {
        if (!payload?.payload?.eventId || payload.payload.eventId === eventIdOrSlug) {
          onUpdate(payload);
        }
      })
      .on('broadcast', { event: 'event_updated' }, (payload) => {
        onUpdate(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
    };
  } catch {
    return () => {};
  }
}

/**
 * Fetch exact live registration count from server API (bypassing RLS safely)
 */
export async function fetchLiveRegistrationCount(eventIdOrSlug: string): Promise<number> {
  if (!eventIdOrSlug) return 0;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);
    const params = new URLSearchParams();
    if (isUuid) {
      params.set('eventId', eventIdOrSlug);
    } else {
      params.set('slug', eventIdOrSlug);
    }
    const res = await fetch(`/api/registrations?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return 0;
    const json = await res.json();
    return typeof json.count === 'number' ? json.count : 0;
  } catch {
    return 0;
  }
}

/**
 * ─── 8. PROFILE OPERATIONS ────────────────────────────────────────────────────
 */
export async function saveProfileToSupabase(user: UserPublic): Promise<{ success: boolean }> {
  try {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      college: user.college,
      organization: user.organization,
      bio: user.bio,
      skills: user.skills,
      github_url: user.socialLinks?.github,
      linkedin_url: user.socialLinks?.linkedin,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  } catch {
    return { success: true };
  }
}

/**
 * ─── 9. PROJECT SUBMISSION OPERATIONS ─────────────────────────────────────────
 */
export async function saveSubmissionSupabase(
  submission: ProjectSubmission
): Promise<{ success: boolean; data?: ProjectSubmission; error?: string }> {
  // Always save to local storage as fallback/cache first
  saveProjectSubmission(submission);

  try {
    // Resolve UUID for eventId if slug passed & fetch organizer info
    let resolvedEventId = submission.eventId;
    let eventSlug = submission.eventId;
    let eventOrganizerId: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.eventId);

    const { data: eventRow } = await supabase
      .from('events')
      .select('id, slug, organizer_id, created_by')
      .or(isUuid ? `id.eq.${submission.eventId}` : `slug.eq.${submission.eventId}`)
      .maybeSingle();

    if (eventRow) {
      resolvedEventId = eventRow.id;
      if (eventRow.slug) eventSlug = eventRow.slug;
      if (eventRow.organizer_id) eventOrganizerId = eventRow.organizer_id;
      else if ((eventRow as any).created_by) eventOrganizerId = (eventRow as any).created_by;
    }

    if (!eventOrganizerId) {
      const localEvt = getAllEvents().find((e) => e.id === resolvedEventId || e.slug === eventSlug || e.id === submission.eventId);
      if (localEvt) {
        if (localEvt.slug) eventSlug = localEvt.slug;
        if (localEvt.organizerId && localEvt.organizerId !== 'usr_organizer') {
          eventOrganizerId = localEvt.organizerId;
        }
      }
    }

    // Resolve UUID for submitter_id
    let resolvedSubmitterId = submission.submittedBy;
    const isSubmitterUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.submittedBy);
    if (!isSubmitterUuid) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id) {
        resolvedSubmitterId = authData.user.id;
      } else {
        const { data: prof } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (prof?.id) resolvedSubmitterId = prof.id;
      }
    }

    const payload = {
      event_id: resolvedEventId,
      submitter_id: resolvedSubmitterId,
      project_name: submission.projectTitle,
      tagline: submission.tagline || '',
      description: submission.projectDescription,
      repo_url: submission.projectLink,
      demo_url: submission.demoVideoUrl || '',
      video_url: submission.demoVideoUrl || '',
      track: submission.track || 'General Open Track',
      status: submission.status || 'SUBMITTED',
      score: submission.score || 0,
      created_at: submission.submittedAt || new Date().toISOString(),
    };

    // 1. Direct Supabase Client Check & Upsert (without relying on onConflict constraints)
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('event_id', resolvedEventId)
      .eq('submitter_id', resolvedSubmitterId)
      .maybeSingle();

    let data: any = null;
    let error: any = null;

    if (existingSub?.id) {
      const updateRes = await supabase
        .from('submissions')
        .update(payload)
        .eq('id', existingSub.id)
        .select()
        .maybeSingle();
      data = updateRes.data;
      error = updateRes.error;
    } else {
      const insertRes = await supabase
        .from('submissions')
        .insert(payload)
        .select()
        .maybeSingle();
      data = insertRes.data;
      error = insertRes.error;
    }

    // 2. Server-side API sync fallback (in case client RLS needs service role or to trigger server actions)
    if (error || typeof window !== 'undefined') {
      try {
        const apiRes = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submission: {
              ...submission,
              eventId: resolvedEventId,
              submittedBy: resolvedSubmitterId,
            },
          }),
        });
        if (!apiRes.ok) {
          const apiJson = await apiRes.json().catch(() => ({}));
          if (apiJson?.error) {
            return { success: false, error: apiJson.error };
          }
        }
      } catch (apiErr) {
        console.warn('API submissions sync error:', apiErr);
      }
    }

    // 3. Realtime Broadcast to all connected clients & dashboards!
    try {
      const channel = supabase.channel(`submissions_stream_${resolvedEventId}`);
      channel.send({
        type: 'broadcast',
        event: 'submission_created',
        payload: { submission: { ...submission, eventId: resolvedEventId, submittedBy: resolvedSubmitterId } },
      });

      const globalChannel = supabase.channel('public:submissions_realtime');
      globalChannel.send({
        type: 'broadcast',
        event: 'submission_created',
        payload: { submission: { ...submission, eventId: resolvedEventId, submittedBy: resolvedSubmitterId } },
      });
    } catch (broadcastErr) {
      console.warn('Realtime submission broadcast notice:', broadcastErr);
    }

    // 4. Real-time platform notifications (Notify event host ONLY)
    try {
      if (eventOrganizerId) {
        createNotification(
          {
            title: `New Project Submitted: ${submission.projectTitle}`,
            message: `${submission.submittedByName || 'A builder'} just submitted "${submission.projectTitle}" for review.`,
            type: NotificationDbType.EVENT,
            icon: 'rocket',
            eventId: resolvedEventId,
            targetType: NotificationTargetType.SPECIFIC_USER,
            targetUserIds: [eventOrganizerId],
            actionUrl: `/dashboard/events/${resolvedEventId}/submissions`,
            metadata: {
              eventId: resolvedEventId,
              projectTitle: submission.projectTitle,
              submitterName: submission.submittedByName,
              role: 'organizer_alert',
              isSubmission: true,
            },
          },
          resolvedSubmitterId
        ).catch(() => {});
      }
    } catch (notifErr) {}

    return { success: true, data: submission };
  } catch (err: any) {
    console.warn('Supabase submission error (using client storage):', err);
    return { success: true, data: submission };
  }
}

export async function fetchUserSubmissionForEvent(
  eventId: string,
  userId?: string,
  teamId?: string
): Promise<ProjectSubmission | null> {
  if (!eventId) return null;

  // 1. Instant check from local cache
  const local = getProjectSubmission(eventId, userId, teamId);
  if (local) return local;

  try {
    let resolvedEventId = eventId;
    let eventSlug: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    const { data: eventRow } = await supabase
      .from('events')
      .select('id, slug')
      .or(isUuid ? `id.eq.${eventId}` : `slug.eq.${eventId}`)
      .maybeSingle();

    if (eventRow) {
      resolvedEventId = eventRow.id;
      eventSlug = eventRow.slug;
    }

    const eventIdsToSearch = Array.from(new Set([resolvedEventId, eventId, eventSlug].filter(Boolean) as string[]));

    let query = supabase
      .from('submissions')
      .select(`
        *,
        profiles:submitter_id (
          id,
          name,
          email,
          avatar_url,
          college
        )
      `)
      .in('event_id', eventIdsToSearch);

    if (userId && teamId) {
      query = query.or(`submitter_id.eq.${userId},team_id.eq.${teamId}`);
    } else if (userId) {
      query = query.eq('submitter_id', userId);
    } else if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data: dbData } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
    let row = dbData;

    // Fallback: try server API endpoint with scope=mine
    if (!row && typeof window !== 'undefined') {
      try {
        const apiRes = await fetch(`/api/submissions?eventId=${encodeURIComponent(resolvedEventId)}&scope=mine`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.submissions) && apiData.submissions.length > 0) {
            row = apiData.submissions[0];
          }
        }
      } catch {}
    }

    if (!row) return null;

    const mapped: ProjectSubmission = {
      id: row.id,
      eventId: eventId,
      submittedBy: row.submitter_id,
      submittedByName: row.profiles?.name || 'Hacker Builder',
      submittedByEmail: row.profiles?.email || '',
      submittedAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      projectTitle: row.project_name,
      tagline: row.tagline || '',
      projectDescription: row.description,
      projectLink: row.repo_url,
      demoVideoUrl: row.demo_url || row.video_url || '',
      track: row.track || 'General',
      score: Number(row.score || 0),
      status: row.status || 'SUBMITTED',
      teamId: row.team_id || teamId,
      presentationUrl: row.presentation_url || '',
      additionalResources: row.additional_resources || '',
    };

    saveProjectSubmission(mapped);
    return mapped;
  } catch (err) {
    console.warn('Error fetching user submission for event:', err);
    return null;
  }
}

export async function fetchUserSubmissions(
  userId: string
): Promise<ProjectSubmission[]> {
  if (!userId) return [];

  try {
    let fetchedRows: any[] = [];

    // 1. Try server-side same-origin API FIRST (fast ~30ms, zero CORS issues)
    if (typeof window !== 'undefined') {
      try {
        const apiRes = await fetch(`/api/submissions?scope=user&userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.submissions) && apiData.submissions.length > 0) {
            fetchedRows = apiData.submissions;
          }
        }
      } catch (apiErr) {
        console.warn('API fetchUserSubmissions notice:', apiErr);
      }
    }

    // 2. Direct Supabase query fallback
    if (fetchedRows.length === 0) {
      const { data: rows } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            id,
            name,
            email,
            avatar_url,
            college
          )
        `)
        .eq('submitter_id', userId)
        .order('created_at', { ascending: false });

      if (rows && rows.length > 0) {
        fetchedRows = rows;
      }
    }

    if (!fetchedRows || fetchedRows.length === 0) {
      const allLocal = getAllProjectSubmissions();
      return allLocal.filter((s) => s.submittedBy === userId);
    }

    const mappedList: ProjectSubmission[] = fetchedRows.map((row: any) => {
      const sub: ProjectSubmission = {
        id: row.id,
        eventId: row.event_id,
        submittedBy: row.submitter_id,
        submittedByName: row.profiles?.name || 'Hacker Builder',
        submittedByEmail: row.profiles?.email || '',
        submittedAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
        projectTitle: row.project_name,
        tagline: row.tagline || '',
        projectDescription: row.description,
        projectLink: row.repo_url,
        demoVideoUrl: row.demo_url || row.video_url || '',
        track: row.track || 'General',
        score: Number(row.score || 0),
        status: row.status || 'SUBMITTED',
        teamId: row.team_id,
        presentationUrl: row.presentation_url || '',
        additionalResources: row.additional_resources || '',
      };
      saveProjectSubmission(sub);
      return sub;
    });

    return mappedList;
  } catch (err) {
    console.warn('Error fetching user submissions:', err);
    const allLocal = getAllProjectSubmissions();
    return allLocal.filter((s) => s.submittedBy === userId);
  }
}

export async function fetchEventSubmissions(
  eventId: string
): Promise<ProjectSubmission[]> {
  const localList = getAllProjectSubmissions(eventId);

  try {
    let resolvedEventId = eventId;
    let eventSlug: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id, slug')
        .eq('slug', eventId)
        .maybeSingle();
      if (eventRow?.id) {
        resolvedEventId = eventRow.id;
        eventSlug = eventRow.slug;
      }
    } else {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id, slug')
        .eq('id', eventId)
        .maybeSingle();
      if (eventRow?.slug) {
        eventSlug = eventRow.slug;
      }
    }

    const targetEventIds = Array.from(new Set([resolvedEventId, eventId, eventSlug].filter(Boolean) as string[]));

    let rows: any[] = [];

    // 1. Try server-side same-origin API FIRST (fast ~30ms, zero CORS issues, bypasses RLS)
    if (typeof window !== 'undefined') {
      try {
        const apiRes = await fetch(`/api/submissions?eventId=${encodeURIComponent(resolvedEventId)}`, { cache: 'no-store' });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.submissions) && apiData.submissions.length > 0) {
            rows = apiData.submissions;
          }
        }
      } catch (apiErr) {}
    }

    // 2. Direct Supabase query fallback
    if (rows.length === 0) {
      const { data } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            id,
            name,
            email,
            avatar_url,
            college
          )
        `)
        .in('event_id', targetEventIds)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        rows = data;
      }
    }

    if (rows.length === 0) {
      return localList;
    }

    // Merge Supabase rows with local submissions
    const remoteMapped: ProjectSubmission[] = rows.map((row: any) => {
      const local = localList.find((l) => l.id === row.id || (l.submittedBy && l.submittedBy === row.submitter_id));
      const effectiveStatus = (row.status && row.status !== 'SUBMITTED')
        ? row.status
        : (local?.status || row.status || 'SUBMITTED');
      const effectiveScore = Number(row.score !== undefined && row.score !== null ? row.score : (local?.score || 0));

      const mappedSub: ProjectSubmission = {
        id: row.id,
        eventId: eventId,
        submittedBy: row.submitter_id,
        submittedByName: row.profiles?.name || local?.submittedByName || 'Hacker Builder',
        submittedByEmail: row.profiles?.email || local?.submittedByEmail || '',
        submittedAt: row.created_at,
        projectTitle: row.project_name || local?.projectTitle,
        tagline: row.tagline || local?.tagline || '',
        projectDescription: row.description || local?.projectDescription,
        projectLink: row.repo_url || local?.projectLink,
        demoVideoUrl: row.demo_url || row.video_url || local?.demoVideoUrl || '',
        track: row.track || local?.track || 'General',
        score: effectiveScore,
        status: effectiveStatus,
        teamId: row.team_id || local?.teamId,
        teamName: local?.teamName,
        teamMembers: local?.teamMembers,
        presentationUrl: row.presentation_url || local?.presentationUrl,
        additionalResources: row.additional_resources || local?.additionalResources,
        zipFileName: local?.zipFileName,
        zipFileSize: local?.zipFileSize,
        isPinned: local?.isPinned,
        awardTag: local?.awardTag,
      };

      // Cache locally
      saveProjectSubmission(mappedSub);
      return mappedSub;
    });

    // Deduplicate with local list (read-only merge without triggering mutation broadcasts)
    const combined = [...remoteMapped];
    localList.forEach((local) => {
      if (!combined.some((c) => (local.submittedBy && c.submittedBy === local.submittedBy) || c.id === local.id)) {
        combined.push(local);
      }
    });

    return combined;
  } catch (err) {
    console.warn('Error fetching remote submissions, using local list:', err);
    return localList;
  }
}

export async function deleteSubmissionSupabase(
  submissionId: string,
  eventId?: string
): Promise<{ success: boolean; error?: string }> {
  deleteProjectSubmission(submissionId);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
    if (isUuid) {
      await supabase.from('submissions').delete().eq('id', submissionId);
    }
    if (eventId) {
      const channel = supabase.channel(`submissions_stream_${eventId}`);
      channel.send({
        type: 'broadcast',
        event: 'submission_deleted',
        payload: { submissionId },
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function updateSubmissionReviewSupabase(
  submissionId: string,
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED',
  score?: number,
  notes?: string,
  eventId?: string
): Promise<{ success: boolean }> {
  updateProjectSubmissionStatus(submissionId, status, score, notes);

  try {
    // 1. Call server-side API with Admin Client (service role) to bypass client RLS restrictions
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/submissions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, status, score, reviewNotes: notes, eventId }),
        });
      } catch (apiErr) {
        console.warn('API PATCH submission notice:', apiErr);
      }
    }

    // 2. Direct client fallback
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
    if (isUuid) {
      const updateData: any = { status };
      if (score !== undefined) updateData.score = score;
      await supabase.from('submissions').update(updateData).eq('id', submissionId);
    }
    if (eventId) {
      const channel = supabase.channel(`submissions_stream_${eventId}`);
      channel.send({
        type: 'broadcast',
        event: 'submission_updated',
        payload: { submissionId, status, score },
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export function subscribeToEventSubmissions(
  eventId: string,
  onUpdate: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onUpdate();
      }, 400);
    };

    const channelName = `submissions_stream_${eventId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        () => {
          debouncedUpdate();
        }
      )
      .on('broadcast', { event: 'submission_created' }, () => {
        debouncedUpdate();
      })
      .on('broadcast', { event: 'submission_updated' }, () => {
        debouncedUpdate();
      })
      .on('broadcast', { event: 'submission_deleted' }, () => {
        debouncedUpdate();
      })
      .subscribe();

    const globalChannel = supabase
      .channel('public:submissions_realtime')
      .on('broadcast', { event: 'submission_created' }, () => {
        debouncedUpdate();
      })
      .subscribe();

    const handleLocal = () => debouncedUpdate();
    window.addEventListener('hackers_unity_storage_change', handleLocal);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      window.removeEventListener('hackers_unity_storage_change', handleLocal);
    };
  } catch {
    return () => {};
  }
}

export async function fetchAllSubmissionCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // 1. Check local storage submissions
  if (typeof window !== 'undefined') {
    try {
      const localSubs = getAllProjectSubmissions();
      localSubs.forEach((s) => {
        if (s.eventId) {
          counts[s.eventId] = (counts[s.eventId] || 0) + 1;
        }
      });
    } catch {}
  }

  // 2. Try fetching server-side admin counts via API route (fast ~30ms, zero CORS issues)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/submissions?allCounts=true', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.counts) {
          Object.entries(json.counts).forEach(([k, v]) => {
            counts[k] = Math.max(counts[k] || 0, Number(v) || 0);
          });
          return counts;
        }
      }
    } catch {}
  }

  // 3. Fallback direct client query from Supabase
  try {
    const { data: subRows } = await supabase.from('submissions').select('event_id');
    const { data: eventRows } = await supabase.from('events').select('id, slug');

    const idToSlug = new Map<string, string>();
    const slugToId = new Map<string, string>();
    eventRows?.forEach((e: any) => {
      if (e.id && e.slug) {
        idToSlug.set(e.id, e.slug);
        slugToId.set(e.slug, e.id);
      }
    });

    if (subRows) {
      subRows.forEach((row: any) => {
        if (row.event_id) {
          counts[row.event_id] = (counts[row.event_id] || 0) + 1;
          const slug = idToSlug.get(row.event_id);
          if (slug) {
            counts[slug] = (counts[slug] || 0) + 1;
          }
        }
      });
    }
  } catch (err) {
    console.warn('Error fetching submission counts from Supabase:', err);
  }

  return counts;
}

export function subscribeToAllSubmissions(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const channel = supabase
      .channel(`submissions_all_realtime_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => onUpdate()
      )
      .on('broadcast', { event: 'submission_created' }, () => onUpdate())
      .on('broadcast', { event: 'submission_updated' }, () => onUpdate())
      .on('broadcast', { event: 'submission_deleted' }, () => onUpdate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export async function fetchAllRegistrationCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // 1. Check local storage registrations as initial baseline
  if (typeof window !== 'undefined') {
    try {
      const allEvents = getAllEvents();
      allEvents.forEach((ev) => {
        const idCount = ev.id ? getEventRegistrationsCount(ev.id) : 0;
        const slugCount = ev.slug ? getEventRegistrationsCount(ev.slug) : 0;
        const localMax = Math.max(idCount, slugCount);
        if (localMax > 0) {
          if (ev.id) counts[ev.id] = Math.max(counts[ev.id] || 0, localMax);
          if (ev.slug) counts[ev.slug] = Math.max(counts[ev.slug] || 0, localMax);
        }
      });
    } catch {}
  }

  // 2. Try fetching server-side admin counts via API route (fast, accurate & bypasses RLS)
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/registrations?allCounts=true', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.counts) {
          Object.entries(json.counts).forEach(([k, v]) => {
            counts[k] = Math.max(counts[k] || 0, Number(v) || 0);
          });
          return counts;
        }
      }
    } catch {}
  }

  // 3. Fallback direct client query from Supabase
  try {
    const { data: eventRows } = await supabase
      .from('events')
      .select('id, slug, registration_count, participants_count');

    const idToSlug = new Map<string, string>();
    eventRows?.forEach((e: any) => {
      if (e.id) {
        if (e.slug) idToSlug.set(e.id, e.slug);
        const baseline = Math.max(
          typeof e.registration_count === 'number' ? e.registration_count : 0,
          typeof e.participants_count === 'number' ? e.participants_count : 0
        );
        counts[e.id] = Math.max(counts[e.id] || 0, baseline);
        if (e.slug) counts[e.slug] = Math.max(counts[e.slug] || 0, baseline);
      }
    });

    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id');

    if (regRows && regRows.length > 0) {
      const dbCounts: Record<string, number> = {};
      regRows.forEach((r: any) => {
        if (r.event_id) {
          dbCounts[r.event_id] = (dbCounts[r.event_id] || 0) + 1;
        }
      });

      Object.entries(dbCounts).forEach(([eventId, count]) => {
        counts[eventId] = Math.max(counts[eventId] || 0, count);
        const slug = idToSlug.get(eventId);
        if (slug) {
          counts[slug] = Math.max(counts[slug] || 0, count);
        }
      });
    }
  } catch (err) {
    console.warn('Error fetching registration counts from Supabase:', err);
  }

  return counts;
}

export function subscribeToAllRegistrations(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const channel = supabase
      .channel(`registrations_all_realtime_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => onUpdate()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => onUpdate()
      )
      .on('broadcast', { event: 'registration_created' }, () => onUpdate())
      .on('broadcast', { event: 'registration_updated' }, () => onUpdate())
      .on('broadcast', { event: 'registration_deleted' }, () => onUpdate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export interface ContactInquiryInput {
  name: string;
  email: string;
  phone?: string;
  inquiryType?: string;
  subject: string;
  message: string;
}

export async function submitContactInquiry(
  input: ContactInquiryInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 1. Try server API route first
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const data = await response.json().catch(() => ({}));
        if (response.ok && data.success) {
          return { success: true, message: data.message };
        } else if (data.error) {
          return { success: false, error: data.error };
        }
      } catch (apiErr) {
        console.warn('[Contact] API fetch error, falling back to client:', apiErr);
      }
    }

    // 2. Direct client fallback
    let { error } = await supabase.from('contact_inquiries').insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ? input.phone.trim() : null,
      inquiry_type: input.inquiryType || 'general',
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    });

    if (error && (error.code === 'PGRST204' || error.message?.includes('phone'))) {
      const fallbackMsg = input.phone ? `[Contact: ${input.phone.trim()}]\n\n${input.message.trim()}` : input.message.trim();
      const retry = await supabase.from('contact_inquiries').insert({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        inquiry_type: input.inquiryType || 'general',
        subject: input.subject.trim(),
        message: fallbackMsg,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      });
      error = retry.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Your inquiry has been submitted successfully.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit inquiry' };
  }
}

/**
 * ─── 15. EVENT ORGANIZING TEAM & CO-HOST ADMINS ──────────────────────────────
 */

export interface EventAdminMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export interface EventTeamData {
  event: { id: string; slug: string; title: string };
  isOwner: boolean;
  isCoHost: boolean;
  inviteCode: string;
  inviteUrl: string;
  owner: {
    id: string;
    full_name: string;
    email?: string;
    avatar_url?: string;
  };
  admins: EventAdminMember[];
}

export async function fetchEventTeam(
  eventId: string
): Promise<{ success: boolean; data?: EventTeamData; error?: string }> {
  try {
    const res = await fetch(`/api/events/team?eventId=${encodeURIComponent(eventId)}`);
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to fetch event team' };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function fetchInvitePreview(
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/events/team?code=${encodeURIComponent(code)}`);
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Invalid or expired invite link' };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function joinEventTeamByCode(
  code: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/events/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', code }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to join event team' };
    }
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function regenerateEventInviteCode(
  eventId: string
): Promise<{ success: boolean; inviteCode?: string; inviteUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/events/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate_code', eventId }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to regenerate invite link' };
    }
    return { success: true, inviteCode: json.inviteCode, inviteUrl: json.inviteUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function removeEventAdmin(
  eventId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/events/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, adminUserId }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to remove admin' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * ─── 13. REAL-TIME BUILDERS & PROFILE OPERATIONS ──────────────────────────────
 */

export interface PublicProfileResult {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: string;
  college: string | null;
  organization: string | null;
  professionType: string;
  bio: string | null;
  skills: string[];
  socialLinks: {
    github: string | null;
    linkedin: string | null;
    portfolio: string | null;
  };
  winningsCount: number;
  participationsCount: number;
  createdAt: string;
}

export interface FullPublicProfileData {
  user: UserPublic;
  winnings: Array<{
    id: string;
    projectTitle: string;
    tagline?: string;
    projectDescription?: string;
    repoUrl?: string;
    demoUrl?: string;
    track?: string;
    eventTitle?: string;
    eventSlug?: string;
    totalPrizeValue?: number;
    awardedAt?: string;
  }>;
  participations: Array<{
    registrationId: string;
    eventId: string;
    eventTitle: string;
    eventSlug: string;
    role: string;
    status: string;
    teamName: string | null;
    registeredAt: string;
    category: string;
    eventType: string;
    location: string;
    totalPrizeValue: number;
    organizerName: string;
  }>;
  submissions: any[];
  stats: {
    totalParticipations: number;
    totalWinnings: number;
    totalSubmissions: number;
  };
}

/**
 * Live search builders across Supabase by username, name, or skills
 */
export async function searchProfilesRealtime(query: string = '', limit = 20): Promise<PublicProfileResult[]> {
  try {
    const clean = query.trim();
    const url = `/api/users/search?q=${encodeURIComponent(clean)}&limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    console.warn('[searchProfilesRealtime] Fetch warning:', err);
    return [];
  }
}

/**
 * Fetch a user's full public profile with social links, winnings, and participations
 */
export async function getPublicUserProfileByUsername(username: string): Promise<FullPublicProfileData | null> {
  try {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return null;
    const res = await fetch(`/api/users/${encodeURIComponent(clean)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[getPublicUserProfileByUsername] Fetch warning:', err);
    return null;
  }
}

/**
 * Realtime subscription to profiles table changes
 */
export function subscribeToProfilesRealtime(onChange: () => void): () => void {
  const channelName = `realtime_profiles_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations' },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * ─── PAYMENTS: FETCH USER PAYMENTS ──────────────────────────────────────────
 */
export async function fetchUserPaymentsSupabase(
  userId: string,
  email?: string,
  options?: { isAdmin?: boolean; scope?: 'all' | 'user'; eventId?: string }
): Promise<any[]> {
  if (!userId && !email && !options?.isAdmin && options?.scope !== 'all') return [];

  // 1. Try server-side API first (bypasses RLS with service-role client, supports admin & all view)
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (email) params.set('email', email);
      if (options?.isAdmin) params.set('isAdmin', 'true');
      if (options?.scope) params.set('scope', options.scope);
      if (options?.eventId) params.set('eventId', options.eventId);

      const res = await fetch(`/api/payments?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.payments)) {
          return json.payments;
        }
      }
    } catch (apiErr) {
      console.warn('[Payments] API fetch fallback to direct supabase query:', apiErr);
    }
  }

  // 2. Direct Supabase query fallback
  try {
    let query = supabase.from('payments').select('*, events(slug, title, banner_url)');
    if (options?.scope === 'all' || options?.isAdmin) {
      // Admin query without user-specific filter
    } else if (userId && email) {
      query = query.or(`user_id.eq.${userId},team_leader_email.eq.${email}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('team_leader_email', email);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // Fallback without events relation join in case table relationships aren't cached
      let fallbackQuery = supabase.from('payments').select('*');
      if (options?.scope === 'all' || options?.isAdmin) {
        // Admin query without filter
      } else if (userId && email) {
        fallbackQuery = fallbackQuery.or(`user_id.eq.${userId},team_leader_email.eq.${email}`);
      } else if (userId) {
        fallbackQuery = fallbackQuery.eq('user_id', userId);
      } else if (email) {
        fallbackQuery = fallbackQuery.eq('team_leader_email', email);
      }
      const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('created_at', { ascending: false });
      if (fallbackError) {
        console.warn('[Supabase] fetchUserPaymentsSupabase error:', fallbackError.message);
        return [];
      }
      return fallbackData || [];
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] fetchUserPaymentsSupabase exception:', err);
    return [];
  }
}

/**
 * ─── PAYMENTS: FETCH EVENT PAYMENTS (FOR ORGANIZER DASHBOARD) ───────────────
 */
export async function fetchEventPaymentsSupabase(eventId: string): Promise<any[]> {
  if (!eventId) return [];
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchEventPaymentsSupabase error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] fetchEventPaymentsSupabase exception:', err);
    return [];
  }
}

/**
 * ─── PAYMENTS: CHECK PAYMENT STATUS FOR TEAM OR REGISTRATION ────────────────
 */
export async function checkPaymentStatusSupabase(
  eventId: string,
  teamId?: string | null,
  userId?: string | null,
  email?: string | null
): Promise<{ isPaid: boolean; payment?: any }> {
  if (!eventId) return { isPaid: false };
  try {
    // 1. Try server-side status API first (bypasses RLS so squad members can see leader payment)
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('eventId', eventId);
      if (teamId) params.set('teamId', teamId);
      if (userId) params.set('userId', userId);
      if (email) params.set('email', email);

      const res = await fetch(`/api/payments/status?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.isPaid) {
        return { isPaid: true, payment: data.payment };
      }
    } catch (apiErr) {
      // Fallback to client query if API call fails
    }

    let paidPayment: any = null;

    // 2. Direct client check by teamId
    if (teamId && teamId !== 'solo') {
      const { data: teamRows } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .eq('team_id', teamId)
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1);

      if (teamRows && teamRows.length > 0) {
        paidPayment = teamRows[0];
      }
    }

    // 3. Direct client check by userId
    if (!paidPayment && userId) {
      const { data: userRows } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1);

      if (userRows && userRows.length > 0) {
        paidPayment = userRows[0];
      }
    }

    // 4. Direct client check by email
    if (!paidPayment && email) {
      const { data: emailRows } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .ilike('team_leader_email', email.trim())
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1);

      if (emailRows && emailRows.length > 0) {
        paidPayment = emailRows[0];
      }
    }

    // 5. Fallback: Check if the team record is marked PAID
    if (!paidPayment && teamId && teamId !== 'solo') {
      const { data: teamData } = await supabase
        .from('teams')
        .select('payment_status, payment_id')
        .eq('id', teamId)
        .maybeSingle();

      if (teamData && teamData.payment_status === 'PAID') {
        return {
          isPaid: true,
          payment: {
            status: 'PAID',
            team_id: teamId,
            event_id: eventId,
            id: teamData.payment_id,
          },
        };
      }
    }

    // 6. Fallback: Check if registrations table has verified PAID status
    if (!paidPayment) {
      let regQuery = supabase
        .from('registrations')
        .select('payment_status, payment_id')
        .eq('event_id', eventId)
        .eq('payment_status', 'PAID');

      if (teamId && teamId !== 'solo') {
        regQuery = regQuery.eq('team_id', teamId);
      } else if (userId) {
        regQuery = regQuery.eq('user_id', userId);
      } else if (email) {
        regQuery = regQuery.ilike('user_email', email.trim());
      }

      const { data: regRows } = await regQuery.limit(1);
      if (regRows && regRows.length > 0) {
        return {
          isPaid: true,
          payment: {
            status: 'PAID',
            id: regRows[0].payment_id || `reg_paid_${eventId}`,
            event_id: eventId,
            team_id: teamId || null,
          },
        };
      }
    }

    return {
      isPaid: Boolean(paidPayment && paidPayment.status === 'PAID'),
      payment: paidPayment || null,
    };
  } catch (err) {
    console.warn('[Supabase] checkPaymentStatusSupabase exception:', err);
    return { isPaid: false };
  }
}

/**
 * ─── 16. EVENT ADMIN & CO-HOST ACCESS VERIFICATION ─────────────────────────
 * Verifies whether the specified user has administrative/host privileges for an event.
 */
export async function checkIsUserEventAdminOrHost(
  eventIdOrSlug: string,
  userId: string,
  userEmail?: string
): Promise<boolean> {
  if (!eventIdOrSlug || !userId) return false;

  try {
    // 1. Resolve event UUID if given a slug
    let targetEventId = eventIdOrSlug;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdOrSlug);

    if (!isUuid) {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('slug', eventIdOrSlug)
        .maybeSingle();

      if (eventRow) {
        if (eventRow.organizer_id === userId) return true;
        targetEventId = eventRow.id;
      }
    } else {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('id', eventIdOrSlug)
        .maybeSingle();

      if (eventRow?.organizer_id === userId) return true;
    }

    // 2. Query event_admins table directly
    if (targetEventId) {
      const { data: adminRow } = await supabase
        .from('event_admins')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (adminRow?.id) return true;
    }

    // 3. Fallback: Query backend team API which runs with service role admin client
    try {
      const teamRes = await fetch(`/api/events/team?eventId=${encodeURIComponent(targetEventId || eventIdOrSlug)}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData?.isOwner || teamData?.isCoHost) {
          return true;
        }
      }
    } catch {}
  } catch (err) {
    console.warn('Error verifying event admin access:', err);
  }

  return false;
}

