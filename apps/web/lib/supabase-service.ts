import { supabase } from './supabase';
import { ExtendedEvent, MOCK_EVENTS } from './mock-data';
import { getEventPreviewToken } from './utils';
import {
  UserPublic,
  EventStatus,
  EventCategory,
  EventType,
  NotificationDbType,
  NotificationTargetType,
} from '@hackers-unity/shared-types';
import { createNotification, sendNotificationToUser } from './notification-service';
import {
  getCustomEvents,
  getAllEvents,
  saveHostedEvent,
  ProjectSubmission,
  getAllProjectSubmissions,
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
  const formattedPrize = prizeVal > 0 ? (item.prize || `$${prizeVal.toLocaleString()}`) : 'Perks & Swag';

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
    registrationLink: item.registration_link || null,
    status: (item.status as EventStatus) || EventStatus.PUBLISHED,
    maxParticipants: item.max_participants || 2000,
    minTeamSize: minTeam,
    maxTeamSize: maxTeam,
    teamSize: isTeam ? teamSizeDisplay : 'Individual',
    isTeamEvent: isTeam,
    location: item.location || 'Online',
    createdAt: item.created_at || new Date().toISOString(),
    participantsCount: item.registration_count || item.participants_count || 1,
    participantsDisplay: `${item.registration_count || item.participants_count || 1}+`,
    featured: Boolean(item.featured),
    tags: item.tags || ['Hackathon', 'Innovation'],
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
    registrationType: item.registration_type || 'FREE',
    entryFee: item.entry_fee ?? item.entryFee ?? null,
    currency: item.currency || 'INR',
    registrationCapacity: item.registration_capacity || null,
    approvalMode: item.approval_mode || 'MANUAL',
    customQuestions: item.custom_questions || [],
    registrationFields: item.registration_fields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'],
    previewToken: item.preview_token || item.previewToken || (item.slug ? getEventPreviewToken(item) : undefined),
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
 * ─── 2. ASSET UPLOAD (Supabase Storage) ───────────────────────────────────────
 */
export async function uploadHackathonAsset(
  file: File,
  folder: 'logos' | 'banners' | 'general' = 'general'
): Promise<{ url: string | null; error?: string }> {
  try {
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
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('status', ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'])
      .order('created_at', { ascending: false });

    let list: ExtendedEvent[] = [];
    if (!error && data && data.length > 0) {
      list = data.map(mapDbEventToExtended);
    } else {
      list = [...MOCK_EVENTS];
    }

    // Merge custom events with remote list (avoiding duplicate slugs/ids)
    const map = new Map<string, ExtendedEvent>();
    list.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
        map.set(e.id, e);
      }
    });
    custom.forEach((e) => {
      // Local custom events will take priority or complement (only if published/active)
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        e.status !== EventStatus.PENDING_APPROVAL &&
        e.status !== EventStatus.DRAFT
      ) {
        map.set(e.id, e);
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.warn('Supabase fetchPublishedEvents exception:', err);
    const deletedIds: string[] =
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('hackers_unity_deleted_events') || '[]')
        : [];
    const custom = typeof window !== 'undefined' ? getCustomEvents() : [];
    const map = new Map<string, ExtendedEvent>();
    MOCK_EVENTS.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
        map.set(e.id, e);
      }
    });
    custom.forEach((e) => {
      if (
        !deletedIds.includes(e.id) &&
        !deletedIds.includes(e.slug) &&
        e.status !== EventStatus.PENDING_APPROVAL &&
        e.status !== EventStatus.DRAFT
      ) {
        map.set(e.id, e);
      }
    });
    return Array.from(map.values());
  }
}

export async function fetchEventBySlug(slugOrId: string): Promise<ExtendedEvent | null> {
  if (!slugOrId) return null;
  const decoded = decodeURIComponent(slugOrId).trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);

    let data: any = null;

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
    }

    if (data) {
      return mapDbEventToExtended(data);
    }

    // Check custom events in local storage
    if (typeof window !== 'undefined') {
      const custom = getCustomEvents();
      const customFound = custom.find(
        (e) => e.slug === decoded || e.id === decoded || e.slug.toLowerCase() === decoded.toLowerCase()
      );
      if (customFound) return customFound;
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

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    const remoteEvents = (!error && data) ? data.map(mapDbEventToExtended) : [];

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
    customOrganizerEvents.forEach((e) => {
      if (!deletedIds.includes(e.id) && !deletedIds.includes(e.slug)) {
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
      registration_capacity: event.registrationCapacity || 2000,
      approval_mode: event.approvalMode || 'AUTO',
      custom_questions: event.customQuestions || [],
    };

    let { data, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

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
    // Automatically broadcast notification ONLY when event is approved/live, not while pending
    if (createdEvent.status === EventStatus.PUBLISHED || (createdEvent.status as any) === 'REGISTRATION_OPEN') {
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
        const response = await fetch('/api/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, updates }),
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            return { success: true };
          }
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
    if (updates.bannerUrl !== undefined) updatePayload.banner_url = updates.bannerUrl;
    if (updates.organizerName !== undefined) updatePayload.organizer_name = updates.organizerName;
    if (updates.organizerAvatar !== undefined) updatePayload.organizer_avatar = updates.organizerAvatar;
    if (updates.organizerId !== undefined) updatePayload.organizer_id = updates.organizerId;
    if (updates.registrationType !== undefined) updatePayload.registration_type = updates.registrationType;
    if (updates.registrationCapacity !== undefined) updatePayload.registration_capacity = updates.registrationCapacity;
    if (updates.approvalMode !== undefined) updatePayload.approval_mode = updates.approvalMode;
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    updatePayload.updated_at = new Date().toISOString();

    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let clientQuery = supabase.from('events').update(updatePayload);
    if (isUuid) {
      clientQuery = clientQuery.eq('id', eventId);
    } else {
      clientQuery = clientQuery.eq('slug', eventId);
    }
    const { error } = await clientQuery;

    if (error) {
      console.warn('Direct Supabase update error:', error.message);
      return { success: true };
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
    if (userId) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .maybeSingle();

      if (data) return { isRegistered: true, registration: data };
    }

    if (email) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_email', email)
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

            // Notification
            if (input.userId) {
              sendNotificationToUser(
                input.userId,
                '🎉 Registration Confirmed!',
                `You have successfully registered for the hackathon. Check your team status and event schedule on your dashboard!`,
                NotificationDbType.REGISTRATION,
                {
                  icon: '🎉',
                  eventId: input.eventId,
                  actionUrl: `/dashboard`,
                }
              ).catch((e) => console.warn('Registration notification error:', e));
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
      custom_answers: input.customAnswers || {},
      is_team: Boolean(input.isTeam),
      team_name: input.teamName || null,
      role: input.role || (input.isTeam ? 'Team Leader' : 'Individual Hacker'),
      status: input.status || 'CONFIRMED',
      registered_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('registrations').insert(payload);

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

    // Automatically send confirmation notification to registered user
    if (input.userId) {
      sendNotificationToUser(
        input.userId,
        '🎉 Registration Confirmed!',
        `You have successfully registered for the hackathon. Check your team status and event schedule on your dashboard!`,
        NotificationDbType.REGISTRATION,
        {
          icon: '🎉',
          eventId: input.eventId,
          actionUrl: `/dashboard`,
        }
      ).catch((e) => console.warn('Auto notification error on register:', e));
    }

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

    const fetchPromise = supabase
      .from('registrations')
      .select('*')
      .eq('event_id', targetId)
      .order('registered_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: 'timeout' }), 1200)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function fetchUserRegistrations(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error || !data) return [];
    return data;
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
    // 1. Try server API route first
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            teamId,
            userId,
            maxMembers,
            userName: userDetails?.name,
            userEmail: userDetails?.email,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success) {
            return { success: true };
          } else if (resData.error) {
            return { success: false, error: resData.error };
          }
        }
      } catch (apiErr) {
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

    const { data: members } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId);

    if (members && members.length >= maxMembers) {
      return { success: false, error: 'This team has already reached its maximum capacity.' };
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
    const currentMembers = team.team_members?.length || 0;
    const maxMembers = team.max_members || 4;
    if (currentMembers >= maxMembers) {
      return { success: false, error: 'This team has already reached its maximum capacity.' };
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
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), team_invitations(id, invited_email, status, created_at)')
      .eq('id', teamId)
      .maybeSingle();

    if (error || !data) return local;
    return data;
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
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at)')
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

  const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  if (!isEventUuid || eventId.startsWith('evt_custom_')) {
    return null;
  }

  try {
    if (!eventId || !userId) return null;

    // Check if leader
    const { data: leaderTeam } = await supabase
      .from('teams')
      .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at, invite_token)')
      .eq('event_id', eventId)
      .eq('leader_id', userId)
      .maybeSingle();

    if (leaderTeam) {
      const inviteToken =
        leaderTeam.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
        leaderTeam.name;
      return { ...leaderTeam, invite_token: inviteToken };
    }

    // Check if member
    const { data: memberRow } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (memberRow && memberRow.length > 0) {
      const teamIds = memberRow.map((m: any) => m.team_id);
      const { data: memberTeam } = await supabase
        .from('teams')
        .select('*, profiles:leader_id(name, email, avatar_url), team_members(*, profiles:user_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date), team_invitations(id, invited_email, status, created_at, invite_token)')
        .eq('event_id', eventId)
        .in('id', teamIds)
        .maybeSingle();

      if (memberTeam) {
        const inviteToken =
          memberTeam.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
          memberTeam.name;
        return { ...memberTeam, invite_token: inviteToken };
      }
    }

    return null;
  } catch {
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

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
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
        await fetch('/api/submissions', {
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

    // 4. Real-time platform notifications
    try {
      // Send review notification ONLY to the event host/organizer
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
          },
          resolvedSubmitterId
        ).catch(() => {});
      }

      // Send confirmation to the submitter pointing to the public hackathon page (never the organizer dashboard)
      if (resolvedSubmitterId && resolvedSubmitterId !== eventOrganizerId) {
        createNotification(
          {
            title: `Submission Received: ${submission.projectTitle}`,
            message: `Your project "${submission.projectTitle}" has been submitted successfully for review!`,
            type: NotificationDbType.EVENT,
            icon: 'rocket',
            eventId: resolvedEventId,
            targetType: NotificationTargetType.SPECIFIC_USER,
            targetUserIds: [resolvedSubmitterId],
            actionUrl: `/hackathons/${eventSlug}`,
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

export async function fetchEventSubmissions(
  eventId: string
): Promise<ProjectSubmission[]> {
  const localList = getAllProjectSubmissions(eventId);

  try {
    let resolvedEventId = eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUuid) {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (eventRow?.id) {
        resolvedEventId = eventRow.id;
      }
    }

    const { data, error } = await supabase
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
      .eq('event_id', resolvedEventId)
      .order('created_at', { ascending: false });

    let rows = data || [];
    if (rows.length === 0 && typeof window !== 'undefined') {
      try {
        const apiRes = await fetch(`/api/submissions?eventId=${encodeURIComponent(resolvedEventId)}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.submissions) && apiData.submissions.length > 0) {
            rows = apiData.submissions;
          }
        }
      } catch (apiErr) {}
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

      return {
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
      };
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

  // 2. Fetch all from Supabase directly & map both UUID and slug
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

