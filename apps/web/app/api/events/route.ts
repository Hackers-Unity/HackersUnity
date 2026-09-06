import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EventStatus } from '@hackers-unity/shared-types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qifwhjfisipxkytsqxez.supabase.co';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VEbLNd33E-R6hlSsmvMXhA_k_xrQnX8';

const serverSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || 'hackathon';
  try {
    const { data } = await serverSupabase
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

    let counter = 2;
    while (existingSlugs.has(`${baseSlug}-${counter}`)) {
      counter++;
    }
    return `${baseSlug}-${counter}`;
  } catch {
    return `${baseSlug}-${Date.now().toString(36).substring(4)}`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, userId } = body;

    if (!event || !event.title) {
      return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    const finalSlug = event.slug || (await generateUniqueSlug(event.title));

    const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'];
    const sanitizedStatus = VALID_STATUSES.includes(event.status) ? event.status : 'PENDING_APPROVAL';

    let validOrganizerId: string | null = null;
    if (userId && typeof userId === 'string' && userId.length >= 10 && userId.includes('-')) {
      const { data: profileExists } = await serverSupabase
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

    const { data, error } = await serverSupabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Server Supabase event insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Server error creating event:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { eventId, updates } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
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
    if (updates.tagline !== undefined) updatePayload.tagline = updates.tagline;
    if (updates.logoUrl !== undefined) updatePayload.logo_url = updates.logoUrl;
    if (updates.bannerUrl !== undefined) updatePayload.banner_url = updates.bannerUrl;
    if (updates.registrationStart !== undefined) updatePayload.registration_start = updates.registrationStart;
    if (updates.timezone !== undefined) updatePayload.timezone = updates.timezone;
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.registrationType !== undefined) updatePayload.registration_type = updates.registrationType;
    if (updates.registrationCapacity !== undefined) updatePayload.registration_capacity = updates.registrationCapacity;
    if (updates.approvalMode !== undefined) updatePayload.approval_mode = updates.approvalMode;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    if (updates.registrationFields !== undefined) updatePayload.registration_fields = updates.registrationFields;

    const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'];
    if (updates.status && VALID_STATUSES.includes(updates.status)) {
      updatePayload.status = updates.status;
    }

    const { error } = await serverSupabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId);

    if (error) {
      console.error('Server Supabase event update error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Server error updating event:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const eventIdParam = url.searchParams.get('eventId') || url.searchParams.get('id');
    const slugParam = url.searchParams.get('slug');

    let eventId = eventIdParam;
    let slug = slugParam;

    if (!eventId && !slug) {
      try {
        const body = await req.json();
        eventId = body.eventId || body.id;
        slug = body.slug;
      } catch {}
    }

    const queryKey = eventId || slug;
    if (!queryKey) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    // 1. Locate the event to find both ID and slug
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let existing: { id: string; slug: string } | null = null;

    if (isUuid && eventId) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, slug')
        .eq('id', eventId)
        .maybeSingle();
      if (data) existing = data;
    }

    if (!existing && (slug || eventId)) {
      const targetSlug = slug || eventId;
      const { data } = await serverSupabase
        .from('events')
        .select('id, slug')
        .eq('slug', targetSlug)
        .maybeSingle();
      if (data) existing = data;
    }

    const finalId = existing?.id || (isUuid ? eventId : null);
    const finalSlug = existing?.slug || slug || (isUuid ? null : eventId);

    // 2. Cascade delete dependent child records first to prevent FK constraint failures
    if (finalId) {
      await Promise.allSettled([
        serverSupabase.from('registrations').delete().eq('event_id', finalId),
        serverSupabase.from('bookmarks').delete().eq('event_id', finalId),
        serverSupabase.from('team_invitations').delete().eq('event_id', finalId),
        serverSupabase.from('submissions').delete().eq('event_id', finalId),
        serverSupabase.from('teams').delete().eq('event_id', finalId),
        serverSupabase.from('notifications').delete().eq('event_id', finalId),
      ]);
    }

    // 3. Delete from events table
    let deleteResult;
    if (finalId) {
      deleteResult = await serverSupabase.from('events').delete().eq('id', finalId);
    } else if (finalSlug) {
      deleteResult = await serverSupabase.from('events').delete().eq('slug', finalSlug);
    }

    if (deleteResult?.error) {
      console.error('Server Supabase event delete error:', deleteResult.error.message);
      return NextResponse.json({ error: deleteResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedId: finalId,
      deletedSlug: finalSlug,
    });
  } catch (err: any) {
    console.error('Server error deleting event:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

