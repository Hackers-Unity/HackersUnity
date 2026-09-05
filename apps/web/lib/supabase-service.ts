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
  getLocalTeamInvites,
  saveLocalTeamInvite,
  getLocalInviteByToken,
  updateLocalInviteStatus,
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
    organizerId: item.organizer_id || 'usr_organizer',
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
    const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'];
    const sanitizedStatus = VALID_STATUSES.includes(event.status || '') ? event.status : 'PUBLISHED';

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
      registration_capacity: event.registrationCapacity || null,
      approval_mode: event.approvalMode || 'MANUAL',
      custom_questions: event.customQuestions || [],
      registration_fields: event.registrationFields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'],
      registration_count: 0,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

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

    // Automatically broadcast notification for new hackathon
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
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    if (updates.registrationFields !== undefined) updatePayload.registration_fields = updates.registrationFields;
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId);

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
      setTimeout(() => resolve({ data: null, error: 'timeout' }), 3000)
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
  description?: string
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
        name: 'Squad Leader',
        email: 'leader@hackersunity.dev',
      },
      team_members: [
        {
          id: `member_${Date.now()}`,
          team_id: `team_${Date.now()}`,
          user_id: leaderId,
          role: 'LEADER',
          status: 'ACCEPTED',
          profiles: {
            name: 'Squad Leader',
            email: 'leader@hackersunity.dev',
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

    // 2. Direct client fallback
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
  maxMembers: number = 4
): Promise<{ success: boolean; error?: string }> {
  if (teamId.startsWith('team_')) {
    const member = {
      id: `member_${Date.now()}`,
      team_id: teamId,
      user_id: userId,
      role: 'MEMBER',
      status: 'ACCEPTED',
      profiles: {
        name: 'Squad Member',
        email: 'member@hackersunity.dev',
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

    // 2. Direct client fallback
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
      profiles: {
        name: 'Squad Leader',
        email: 'leader@hackersunity.dev',
      },
    };
    saveLocalTeamInvite(teamId, localInvite);
    const inviteLink = `${origin}/hackathons/${eventId}/invite?token=${token}`;

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
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*, teams(id, name, event_id, leader_id, description, profiles:leader_id(name, email, avatar_url)), events(id, title, slug, start_date, end_date)')
      .eq('invited_email', email.toLowerCase().trim())
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
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
    // 1. Get the invite
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

    // 2. Check team capacity
    const currentMembers = team.team_members?.length || 0;
    const maxMembers = team.max_members || 4;
    if (currentMembers >= maxMembers) {
      return { success: false, error: 'This team has already reached its maximum capacity.' };
    }

    // Try updating Supabase (non-blocking if table is missing)
    try {
      await supabase
        .from('team_invitations')
        .update({ status: 'ACCEPTED', responded_at: new Date().toISOString() })
        .eq('invite_token', inviteToken);
    } catch {
      // ignore
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
  if (inviteToken.startsWith('inv_token_')) {
    updateLocalInviteStatus(inviteToken, 'DECLINED');
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'DECLINED', responded_at: new Date().toISOString() })
      .eq('invite_token', inviteToken)
      .eq('status', 'PENDING');

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
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
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (teamId.startsWith('team_')) {
    deleteLocalTeam(teamId);
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
            return { success: true };
          }
        }
      } catch (apiErr) {
        console.warn('API /api/teams DELETE error, falling back:', apiErr);
      }
    }

    // 2. Direct client fallback
    // Fetch team to verify user is leader and get event_id
    const { data: team, error: fetchErr } = await supabase
      .from('teams')
      .select('id, leader_id, event_id')
      .eq('id', teamId)
      .maybeSingle();

    if (fetchErr || !team) {
      return { success: false, error: 'Team not found' };
    }

    if (team.leader_id !== userId) {
      return { success: false, error: 'Only the squad leader can delete this team.' };
    }

    // 2. Delete team_invitations for this team
    try {
      await supabase.from('team_invitations').delete().eq('team_id', teamId);
    } catch (e) {
      console.warn('team_invitations delete error:', e);
    }

    // 3. Delete team_members for this team
    try {
      await supabase.from('team_members').delete().eq('team_id', teamId);
    } catch (e) {
      console.warn('team_members delete error:', e);
    }

    // 4. Delete the team itself
    const { error: deleteErr } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }

    // 5. Update leader's registration record if exists
    try {
      await supabase
        .from('registrations')
        .update({
          is_team: false,
          team_name: null,
          role: 'Solo Builder',
        })
        .eq('event_id', team.event_id)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('registrations update error:', e);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete squad' };
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

    if (leaderTeam) return leaderTeam;

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

      if (memberTeam) return memberTeam;
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
    // Resolve UUID for eventId if slug passed
    let resolvedEventId = submission.eventId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submission.eventId);
    if (!isUuid) {
      const { data: eventRow } = await supabase
        .from('events')
        .select('id')
        .eq('slug', submission.eventId)
        .maybeSingle();
      if (eventRow?.id) {
        resolvedEventId = eventRow.id;
      }
    }

    const payload = {
      event_id: resolvedEventId,
      submitter_id: submission.submittedBy,
      project_name: submission.projectTitle,
      tagline: submission.tagline || '',
      description: submission.projectDescription,
      repo_url: submission.projectLink,
      demo_url: submission.demoVideoUrl || '',
      video_url: submission.demoVideoUrl || '',
      track: submission.track || 'General Open Track',
      status: submission.status || 'SUBMITTED',
      score: submission.score || 0,
      created_at: submission.submittedAt,
    };

    const { data, error } = await supabase
      .from('submissions')
      .upsert(payload, { onConflict: 'event_id,submitter_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase submission upsert warning (falling back to client storage):', error.message);
      return { success: true, data: submission };
    }

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

    if (error || !data || data.length === 0) {
      return localList;
    }

    // Merge Supabase rows with local submissions
    const remoteMapped: ProjectSubmission[] = data.map((row: any) => ({
      id: row.id,
      eventId: eventId,
      submittedBy: row.submitter_id,
      submittedByName: row.profiles?.name || 'Hacker Builder',
      submittedByEmail: row.profiles?.email || '',
      submittedAt: row.created_at,
      projectTitle: row.project_name,
      tagline: row.tagline || '',
      projectDescription: row.description,
      projectLink: row.repo_url,
      demoVideoUrl: row.demo_url || row.video_url || '',
      track: row.track || 'General',
      score: Number(row.score || 0),
      status: row.status || 'SUBMITTED',
    }));

    // Deduplicate with local list
    const combined = [...remoteMapped];
    localList.forEach((local) => {
      if (!combined.some((c) => c.submittedBy === local.submittedBy || c.id === local.id)) {
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
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function updateSubmissionReviewSupabase(
  submissionId: string,
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED',
  score?: number,
  notes?: string
): Promise<{ success: boolean }> {
  updateProjectSubmissionStatus(submissionId, status, score, notes);

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(submissionId);
    if (isUuid) {
      const updateData: any = { status };
      if (score !== undefined) updateData.score = score;
      await supabase.from('submissions').update(updateData).eq('id', submissionId);
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
    const channel = supabase
      .channel(`submissions_stream_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    const handleLocal = () => onUpdate();
    window.addEventListener('hackers_unity_storage_change', handleLocal);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('hackers_unity_storage_change', handleLocal);
    };
  } catch {
    return () => {};
  }
}

