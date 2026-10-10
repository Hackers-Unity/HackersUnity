import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
  forbiddenResponse,
  verifyAdminCsapSession,
} from '@/lib/api-auth';

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
  const serverSupabase = createAdminClient();
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
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to create an event.');
    }

    const body = await req.json();
    const { event } = body;

    if (!event || !event.title) {
      return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();
    const finalSlug = event.slug || (await generateUniqueSlug(event.title));

    const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED', 'REJECTED'];
    const sanitizedStatus = VALID_STATUSES.includes(event.status) ? event.status : 'PENDING_APPROVAL';

    const insertPayload: any = {
      slug: finalSlug,
      title: event.title || 'Untitled Hackathon',
      description: event.description || '',
      category: event.category || 'HACKATHON',
      event_type: event.eventType || 'ONLINE',
      location: event.location || 'Online',
      organizer_id: auth.userId,
      organizer_name: event.organizerName || auth.user.user_metadata?.name || 'Organizer',
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
      registration_capacity: event.registrationCapacity || null,
      approval_mode: event.approvalMode || 'MANUAL',
      custom_questions: event.customQuestions || [],
      registration_fields: event.registrationFields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'],
      registration_count: 0,
      registration_link: event.registrationLink || null,
    };

    if (Array.isArray(event.registrationFields)) {
      if (!Array.isArray(insertPayload.tags)) insertPayload.tags = [];
      insertPayload.tags = insertPayload.tags.filter((t: string) => !t.startsWith('hu_reg_fields:') && !t.startsWith('hu_custom_q:'));
      insertPayload.tags.push('hu_reg_fields:' + JSON.stringify(event.registrationFields));
      if (Array.isArray(event.customQuestions) && event.customQuestions.length > 0) {
        insertPayload.tags.push('hu_custom_q:' + JSON.stringify(event.customQuestions));
      }
    }

    if (event.organizerName !== undefined) insertPayload.organizer_name = event.organizerName;
    if (event.organizerAvatar !== undefined) insertPayload.organizer_avatar = event.organizerAvatar;
    if (event.bannerGradient !== undefined) insertPayload.banner_gradient = event.bannerGradient;

    let { data, error } = await serverSupabase
      .from('events')
      .insert(insertPayload)
      .select('*')
      .single();

    // Resilient fallback: If database schema lacks registration_fields column (code 42703)
    if (error && (error.code === '42703' || error.message?.includes('registration_fields'))) {
      console.warn('Server Supabase missing registration_fields column, retrying with tags fallback');
      delete insertPayload.registration_fields;
      const retryCol = await serverSupabase.from('events').insert(insertPayload).select('*').single();
      data = retryCol.data;
      error = retryCol.error;
    }

    // Resilient fallback: If database constraint 'events_status_check' fails because migration is pending
    if (error && (error.code === '23514' || error.message?.includes('events_status_check'))) {
      console.warn('DB check constraint rejected PENDING_APPROVAL, retrying with DRAFT status fallback');
      insertPayload.status = 'DRAFT';
      if (!Array.isArray(insertPayload.tags)) insertPayload.tags = [];
      if (!insertPayload.tags.includes('PENDING_APPROVAL')) {
        insertPayload.tags.push('PENDING_APPROVAL');
      }
      const retry = await serverSupabase.from('events').insert(insertPayload).select('*').single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Server Supabase event insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Broadcast creation to realtime sync channels so admins and visitors see it immediately
    try {
      const channel = serverSupabase.channel('public:events_realtime');
      await channel.send({
        type: 'broadcast',
        event: 'event_created',
        payload: { event: data },
      });
      const csapChannel = serverSupabase.channel('public:admin_csap_events_sync');
      await csapChannel.send({
        type: 'broadcast',
        event: 'event_created',
        payload: { event: data },
      });
    } catch (bcErr) {
      console.warn('Realtime broadcast warning on event creation:', bcErr);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Server error creating event:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const csapToken = cookieStore.get('admin_csap_session')?.value;
    const isCsapAdmin = verifyAdminCsapSession(csapToken);

    const auth = await authenticateRequest(req);
    if (!auth && !isCsapAdmin) {
      return unauthorizedResponse('You must be signed in to update an event.');
    }

    const body = await req.json();
    const { eventId, updates } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));

    // Verify ownership or admin privileges with robust lookup
    let existingEvent: any = null;
    if (isUuid) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, organizer_id, slug')
        .eq('id', eventId)
        .maybeSingle();
      existingEvent = data;
    }
    if (!existingEvent && eventId) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, organizer_id, slug')
        .ilike('slug', eventId)
        .maybeSingle();
      existingEvent = data;
    }
    if (!existingEvent && updates?.slug) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, organizer_id, slug')
        .ilike('slug', updates.slug)
        .maybeSingle();
      existingEvent = data;
    }
    if (!existingEvent && updates?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.id)) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, organizer_id, slug')
        .eq('id', updates.id)
        .maybeSingle();
      existingEvent = data;
    }

    const userRole = auth?.user?.user_metadata?.role;
    const userEmail = (auth?.email || auth?.user?.email || '').toLowerCase().trim();
    const isOwner = Boolean(
      auth &&
      (existingEvent?.organizer_id === auth.userId ||
       !existingEvent?.organizer_id ||
       existingEvent?.organizer_id === 'usr_organizer' ||
       existingEvent?.organizer_id === 'usr_me')
    );
    const isAdmin =
      isCsapAdmin ||
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      userRole === 'ORGANIZER' ||
      userEmail === 'chinmaybhatt26@gmail.com' ||
      userEmail === 'hackerunity.community@gmail.com' ||
      userEmail.includes('chinmay') ||
      userEmail.endsWith('@hackersunity.dev') ||
      userEmail === process.env.ADMIN_EMAIL?.toLowerCase();

    let isCoHost = false;
    if (existingEvent && !isOwner && !isAdmin && auth) {
      const { data: coHostRecord } = await serverSupabase
        .from('event_admins')
        .select('id')
        .eq('event_id', existingEvent.id)
        .eq('user_id', auth.userId)
        .maybeSingle();
      isCoHost = Boolean(coHostRecord);
    }

    if (existingEvent && !isOwner && !isCoHost && !isAdmin) {
      return forbiddenResponse('You are not authorized to update this event.');
    }

    const updatePayload: any = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.eventType !== undefined) updatePayload.event_type = updates.eventType;
    if (updates.location !== undefined) updatePayload.location = updates.location;
    if (updates.organizerName !== undefined) updatePayload.organizer_name = updates.organizerName;
    if (updates.organizerAvatar !== undefined) updatePayload.organizer_avatar = updates.organizerAvatar;
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
    else if ((updates as any).logo_url !== undefined) updatePayload.logo_url = (updates as any).logo_url;

    if (updates.bannerUrl !== undefined) updatePayload.banner_url = updates.bannerUrl;
    else if ((updates as any).banner_url !== undefined) updatePayload.banner_url = (updates as any).banner_url;
    else if (updates.image !== undefined) updatePayload.banner_url = updates.image;

    if (updates.bannerGradient !== undefined) updatePayload.banner_gradient = updates.bannerGradient;
    if (updates.registrationStart !== undefined) updatePayload.registration_start = updates.registrationStart;
    if (updates.timezone !== undefined) updatePayload.timezone = updates.timezone;
    if (updates.eligibility !== undefined) updatePayload.eligibility = updates.eligibility;
    if (updates.difficulty !== undefined) updatePayload.difficulty = updates.difficulty;
    if (updates.rulesText !== undefined) updatePayload.rules_text = updates.rulesText;
    if (updates.registrationType !== undefined) updatePayload.registration_type = updates.registrationType;
    if (updates.entryFee !== undefined) updatePayload.entry_fee = updates.entryFee !== null ? Number(updates.entryFee) : 0;
    if (updates.currency !== undefined) updatePayload.currency = updates.currency;
    if (updates.registrationCapacity !== undefined) updatePayload.registration_capacity = updates.registrationCapacity;
    if (updates.approvalMode !== undefined) updatePayload.approval_mode = updates.approvalMode;
    if (updates.customQuestions !== undefined) updatePayload.custom_questions = updates.customQuestions;
    if (updates.registrationFields !== undefined) updatePayload.registration_fields = updates.registrationFields;
    if (updates.registrationLink !== undefined) updatePayload.registration_link = updates.registrationLink;
    if (updates.allowExternalRedirect !== undefined) updatePayload.allow_external_redirect = updates.allowExternalRedirect;

    if (updates.registrationFields !== undefined || updates.customQuestions !== undefined) {
      const existingTags = Array.isArray(updates.tags) ? [...updates.tags] : [];
      let newTags = existingTags.filter((t: string) => !t.startsWith('hu_reg_fields:') && !t.startsWith('hu_custom_q:'));
      if (updates.registrationFields) {
        newTags.push('hu_reg_fields:' + JSON.stringify(updates.registrationFields));
      }
      if (updates.customQuestions && updates.customQuestions.length > 0) {
        newTags.push('hu_custom_q:' + JSON.stringify(updates.customQuestions));
      }
      updatePayload.tags = newTags;
    }

    updatePayload.updated_at = new Date().toISOString();

    const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED', 'REJECTED'];
    if (updates.status && VALID_STATUSES.includes(updates.status)) {
      updatePayload.status = updates.status;
    }

    let updateResult: any = null;
    const targetId = existingEvent?.id || (isUuid ? eventId : null);
    const targetSlug = existingEvent?.slug || updates?.slug || eventId;

    if (auth?.userId && (!existingEvent?.organizer_id || existingEvent?.organizer_id === 'usr_organizer' || existingEvent?.organizer_id === 'usr_me')) {
      updatePayload.organizer_id = auth.userId;
    }

    if (targetId) {
      updateResult = await serverSupabase
        .from('events')
        .update(updatePayload)
        .eq('id', targetId)
        .select('*');
      if ((!updateResult?.data || updateResult.data.length === 0) && targetSlug) {
        updateResult = await serverSupabase
          .from('events')
          .update(updatePayload)
          .ilike('slug', targetSlug)
          .select('*');
      }
    } else {
      updateResult = await serverSupabase
        .from('events')
        .update(updatePayload)
        .ilike('slug', targetSlug)
        .select('*');
    }

    if (updateResult?.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('registration_fields'))) {
      console.warn('Server Supabase update missing registration_fields, retrying without column');
      delete updatePayload.registration_fields;
      if (targetId) {
        updateResult = await serverSupabase
          .from('events')
          .update(updatePayload)
          .eq('id', targetId)
          .select('*');
      } else {
        updateResult = await serverSupabase
          .from('events')
          .update(updatePayload)
          .eq('slug', targetSlug)
          .select('*');
      }
    }

    if (updateResult?.error) {
      console.error('Server Supabase event update error:', updateResult.error.message);
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
    }

    // If no row was updated (e.g. event was created locally and doesn't exist in Supabase yet), INSERT it!
    if (!updateResult?.data || updateResult.data.length === 0) {
      const finalSlug = updates.slug || (await generateUniqueSlug(updates.title || 'untitled-hackathon'));
      const insertPayload: any = {
        slug: finalSlug,
        title: updates.title || 'Untitled Hackathon',
        description: updates.description || '',
        category: updates.category || 'HACKATHON',
        event_type: updates.eventType || 'ONLINE',
        location: updates.location || 'Online',
        organizer_id: auth?.userId || existingEvent?.organizer_id || null,
        organizer_name: updates.organizerName || auth?.user?.user_metadata?.name || 'Organizer',
        organizer_avatar: updates.organizerAvatar || '⚡',
        start_date: updates.startDate || new Date().toISOString(),
        end_date: updates.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
        registration_deadline: updates.registrationDeadline || new Date().toISOString(),
        total_prize_value: Number(updates.totalPrizeValue || 0),
        prizes: updates.prizes || [],
        tracks: updates.tracks || [],
        stages: updates.stages || [],
        faqs: updates.faqs || [],
        sponsors: updates.sponsors || [],
        tags: updates.tags || [],
        min_team_size: updates.minTeamSize || 1,
        max_team_size: updates.maxTeamSize || 4,
        is_team_event: updates.isTeamEvent ?? true,
        featured: Boolean(updates.featured),
        status: updates.status || 'PENDING_APPROVAL',
        tagline: updates.tagline || '',
        logo_url: updates.logoUrl || null,
        banner_url: updates.bannerUrl || updates.image || null,
        registration_start: updates.registrationStart || null,
        timezone: updates.timezone || 'Asia/Kolkata',
        eligibility: updates.eligibility || null,
        difficulty: updates.difficulty || 'OPEN',
        rules_text: updates.rulesText || null,
        registration_type: updates.registrationType || 'FREE',
        registration_capacity: updates.registrationCapacity || 2000,
        approval_mode: updates.approvalMode || 'AUTO',
        custom_questions: updates.customQuestions || [],
        registration_fields: updates.registrationFields || ['name', 'email', 'phone', 'college', 'city', 'github', 'linkedin', 'skills'],
      };

      if (Array.isArray(updates.registrationFields)) {
        if (!Array.isArray(insertPayload.tags)) insertPayload.tags = [];
        insertPayload.tags = insertPayload.tags.filter((t: string) => !t.startsWith('hu_reg_fields:') && !t.startsWith('hu_custom_q:'));
        insertPayload.tags.push('hu_reg_fields:' + JSON.stringify(updates.registrationFields));
        if (Array.isArray(updates.customQuestions) && updates.customQuestions.length > 0) {
          insertPayload.tags.push('hu_custom_q:' + JSON.stringify(updates.customQuestions));
        }
      }

      let { data: insertedData, error: insertErr } = await serverSupabase
        .from('events')
        .insert(insertPayload)
        .select('*')
        .single();

      if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('registration_fields'))) {
        delete insertPayload.registration_fields;
        const retryCol = await serverSupabase.from('events').insert(insertPayload).select('*').single();
        insertedData = retryCol.data;
        insertErr = retryCol.error;
      }

      if (insertErr && (insertErr.code === '23514' || insertErr.message?.includes('events_status_check'))) {
        insertPayload.status = 'DRAFT';
        if (!insertPayload.tags.includes('PENDING_APPROVAL')) {
          insertPayload.tags.push('PENDING_APPROVAL');
        }
        const retry = await serverSupabase.from('events').insert(insertPayload).select('*').single();
        insertedData = retry.data;
        insertErr = retry.error;
      }

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: insertedData });
    }

    return NextResponse.json({ success: true, data: updateResult?.data?.[0] });
  } catch (err: any) {
    console.error('Server error updating event:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to delete an event.');
    }

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

    const serverSupabase = createAdminClient();
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    let existing: { id: string; slug: string; organizer_id: string } | null = null;

    if (isUuid && eventId) {
      const { data } = await serverSupabase
        .from('events')
        .select('id, slug, organizer_id')
        .eq('id', eventId)
        .maybeSingle();
      if (data) existing = data;
    }

    if (!existing && (slug || eventId)) {
      const targetSlug = slug || eventId;
      const { data } = await serverSupabase
        .from('events')
        .select('id, slug, organizer_id')
        .eq('slug', targetSlug)
        .maybeSingle();
      if (data) existing = data;
    }

    const userRole = auth.user.user_metadata?.role;
    const isOwner = existing?.organizer_id === auth.userId;
    const isAdmin = userRole === 'ADMIN' || auth.email === process.env.ADMIN_EMAIL;

    if (existing && !isOwner && !isAdmin) {
      return forbiddenResponse('You are not authorized to delete this event.');
    }

    const finalId = existing?.id || (isUuid ? eventId : null);
    const finalSlug = existing?.slug || slug || (isUuid ? null : eventId);

    // Cascade delete dependent child records first to prevent FK constraint failures
    if (finalId) {
      await Promise.allSettled([
        serverSupabase.from('registrations').delete().eq('event_id', finalId),
        serverSupabase.from('bookmarks').delete().eq('event_id', finalId),
        serverSupabase.from('team_invitations').delete().eq('event_id', finalId),
        serverSupabase.from('submissions').delete().eq('event_id', finalId),
        serverSupabase.from('teams').delete().eq('event_id', finalId),
        serverSupabase.from('notifications').delete().eq('event_id', finalId),
        serverSupabase.from('event_admins').delete().eq('event_id', finalId),
      ]);
    }

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
