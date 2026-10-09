import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
} from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be signed in to register for an event.');
    }

    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { input } = body;

    // Check if bulk registration insert
    if (body.action === 'bulk_insert' && Array.isArray(body.registrations)) {
      const { registrations, eventId: bulkEventId } = body;
      const targetId = bulkEventId || input?.eventId;

      let resolvedEventId = targetId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      if (!isUuid) {
        const { data: ev } = await serverSupabase.from('events').select('id').eq('slug', targetId).maybeSingle();
        if (ev?.id) resolvedEventId = ev.id;
      }

      const rows = registrations.map((r: any) => ({
        event_id: resolvedEventId,
        user_name: r.userName || r.name || 'Hacker',
        user_email: (r.userEmail || r.email || '').toLowerCase().trim(),
        phone: r.phone || null,
        college: r.college || null,
        city: r.city || null,
        github_url: r.githubUrl || null,
        linkedin_url: r.linkedinUrl || null,
        skills: Array.isArray(r.skills) ? r.skills : [],
        status: r.status || 'APPROVED',
        registered_at: r.registeredAt || new Date().toISOString(),
      })).filter((r: any) => Boolean(r.user_email));

      if (rows.length > 0) {
        const { error: bulkErr } = await serverSupabase
          .from('registrations')
          .upsert(rows, { onConflict: 'event_id,user_email' });

        if (bulkErr) {
          return NextResponse.json({ error: bulkErr.message }, { status: 500 });
        }

        // Sync count
        try {
          const { count } = await serverSupabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', resolvedEventId);

          if (typeof count === 'number') {
            await serverSupabase
              .from('events')
              .update({ registration_count: count, updated_at: new Date().toISOString() })
              .eq('id', resolvedEventId);
          }
        } catch {}
      }

      return NextResponse.json({ success: true, count: rows.length });
    }

    if (!input || !input.eventId) {
      return NextResponse.json({ error: 'Missing required registration fields' }, { status: 400 });
    }

    // Resolve event UUID if slug provided
    let targetEventId = input.eventId;
    const isEventUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.eventId);
    if (!isEventUuid) {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id')
        .eq('slug', input.eventId)
        .maybeSingle();
      if (eventData?.id) {
        targetEventId = eventData.id;
      } else {
        // Custom or local event not stored in database
        return NextResponse.json({ success: true, localOnly: true });
      }
    }

    // Always bind registration to authenticated user's ID and email
    const validUserId = auth.userId;
    const userEmail = (auth.email || input.userEmail || '').toLowerCase().trim();

    // Ensure user profile exists
    const { data: existingProf } = await serverSupabase
      .from('profiles')
      .select('id')
      .eq('id', validUserId)
      .maybeSingle();

    if (!existingProf) {
      await serverSupabase.from('profiles').insert({
        id: validUserId,
        name: input.userName || auth.user.user_metadata?.name || 'Hacker',
        email: userEmail,
        phone: input.phone || null,
        college: input.college || null,
        github_url: input.githubUrl || null,
        linkedin_url: input.linkedinUrl || null,
        skills: input.skills || [],
        updated_at: new Date().toISOString(),
      });
    }

    // Check if already registered
    const { data: existingReg } = await serverSupabase
      .from('registrations')
      .select('id')
      .eq('event_id', targetEventId)
      .eq('user_id', validUserId)
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 400 });
    }

    if (userEmail) {
      const { data: existingEmailReg } = await serverSupabase
        .from('registrations')
        .select('id')
        .eq('event_id', targetEventId)
        .eq('user_email', userEmail)
        .maybeSingle();

      if (existingEmailReg) {
        return NextResponse.json({ error: 'This email is already registered for this event.' }, { status: 400 });
      }
    }

    const packedCustomAnswers: Record<string, any> = {
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
      event_id: targetEventId,
      user_id: validUserId,
      user_name: input.userName || auth.user.user_metadata?.name || 'Hacker',
      user_email: userEmail,
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

    let { error: insertErr } = await serverSupabase
      .from('registrations')
      .insert(payload);

    // Resilient fallback: If database schema lacks new columns (code 42703)
    if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('column'))) {
      console.warn('Server Supabase registrations missing optional columns, saving in custom_answers JSONB');
      delete payload.portfolio_url;
      delete payload.resume_url;
      delete payload.discord_handle;
      delete payload.twitter_url;
      delete payload.tshirt_size;
      delete payload.dietary_preference;
      delete payload.experience_level;
      const retryRes = await serverSupabase.from('registrations').insert(payload);
      insertErr = retryRes.error;
    }

    if (insertErr) {
      console.error('Server Supabase registration error:', insertErr.message);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Sync exact live registration count to events table
    try {
      const { count: exactCount } = await serverSupabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', targetEventId);

      if (typeof exactCount === 'number') {
        await serverSupabase
          .from('events')
          .update({ registration_count: exactCount, updated_at: new Date().toISOString() })
          .eq('id', targetEventId);

        // Realtime broadcast to all clients
        try {
          const channel = serverSupabase.channel('public:events_realtime');
          await channel.send({
            type: 'broadcast',
            event: 'registration_created',
            payload: { eventId: targetEventId, count: exactCount },
          });
        } catch (bcErr) {
          console.warn('Realtime broadcast warning:', bcErr);
        }
      }
    } catch (countErr) {
      console.warn('Failed to update event registration count:', countErr);
    }

    // Notify Event Host / Organizer ONLY about the new registration
    try {
      const { data: eventData } = await serverSupabase
        .from('events')
        .select('id, title, slug, organizer_id')
        .eq('id', targetEventId)
        .maybeSingle();

      if (eventData?.organizer_id) {
        const hostUserIds = new Set<string>([eventData.organizer_id]);
        try {
          const { data: coHosts } = await serverSupabase
            .from('event_admins')
            .select('user_id')
            .eq('event_id', targetEventId);
          if (coHosts) {
            coHosts.forEach((ch: any) => {
              if (ch.user_id) hostUserIds.add(ch.user_id);
            });
          }
        } catch {}

        const registrantName = payload.user_name || 'A builder';
        const notifTitle = `New Registration: ${eventData.title}`;
        const notifMsg = `${registrantName} (${payload.user_email}) has registered for "${eventData.title}".`;
        const actionUrl = `/dashboard/events/${eventData.slug || targetEventId}/registrations`;

        const { data: notifRecord } = await serverSupabase
          .from('notifications')
          .insert({
            title: notifTitle,
            message: notifMsg,
            type: 'registration',
            icon: 'sparkles',
            event_id: targetEventId,
            sender_id: validUserId || null,
            target_type: 'specific_user',
            action_url: actionUrl,
            metadata: {
              eventId: targetEventId,
              eventTitle: eventData.title,
              eventSlug: eventData.slug,
              registrantName,
              registrantEmail: payload.user_email,
              role: 'organizer_alert',
            },
          })
          .select('id')
          .single();

        if (notifRecord?.id) {
          const hostRows = Array.from(hostUserIds).map((hId) => ({
            user_id: hId,
            notification_id: notifRecord.id,
            is_read: false,
          }));

          await serverSupabase
            .from('user_notifications')
            .upsert(hostRows, { onConflict: 'user_id,notification_id' });
        }
      }
    } catch (hostNotifErr) {
      console.warn('Failed to send registration notification to host:', hostNotifErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API /api/registrations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET: Fetch exact realtime registration count or full participant list for an event
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const slug = searchParams.get('slug');
    const list = searchParams.get('list');

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    let targetEventId = eventId;
    let eventSlug = slug;
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));
    
    if (!isUuid) {
      const slugQuery = eventId || slug;
      if (slugQuery) {
        const { data: eventData } = await serverSupabase
          .from('events')
          .select('id, slug, registration_count, participants_count')
          .eq('slug', slugQuery)
          .maybeSingle();
        if (eventData?.id) {
          targetEventId = eventData.id;
          eventSlug = eventData.slug;
        } else {
          targetEventId = null;
        }
      }
    } else {
      const { data: evData } = await serverSupabase
        .from('events')
        .select('slug, registration_count, participants_count')
        .eq('id', targetEventId)
        .maybeSingle();
      if (evData?.slug) {
        eventSlug = evData.slug;
      }
    }

    if (!targetEventId) {
      return NextResponse.json({ success: true, count: 0, registrations: [] });
    }

    // Only include valid UUIDs — event_id column is UUID type in Postgres
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const idsToQuery = [targetEventId].filter((id): id is string => Boolean(id && uuidRegex.test(id)));
    if (eventId && uuidRegex.test(eventId) && !idsToQuery.includes(eventId)) {
      idsToQuery.push(eventId);
    }
    if (idsToQuery.length === 0) {
      return NextResponse.json({ success: true, count: 0, registrations: [] });
    }

    // If list of registrations requested (for Manage Registrations dashboard)
    if (list === 'true' || list === '1') {
      const { data: regRows, error: regError } = await serverSupabase
        .from('registrations')
        .select('*')
        .in('event_id', idsToQuery)
        .order('registered_at', { ascending: false });

      if (regError) {
        console.error('Error fetching registrations list:', regError);
        return NextResponse.json({ error: regError.message, registrations: [] }, { status: 500 });
      }

      const map = new Map<string, any>();
      (regRows || []).forEach((row: any) => {
        const key = (row.user_email || row.id || '').toLowerCase().trim();
        if (key && !map.has(key)) {
          map.set(key, {
            id: row.id,
            eventId: row.event_id,
            userId: row.user_id,
            userName: row.user_name || 'Hacker',
            userEmail: row.user_email || '',
            phone: row.phone || '',
            college: row.college || '',
            city: row.city || '',
            githubUrl: row.github_url || '',
            linkedinUrl: row.linkedin_url || '',
            skills: Array.isArray(row.skills) ? row.skills : [],
            portfolioUrl: row.portfolio_url || row.custom_answers?.portfolio_url || row.custom_answers?.portfolioUrl || '',
            resumeUrl: row.resume_url || row.custom_answers?.resume_url || row.custom_answers?.resumeUrl || '',
            discordHandle: row.discord_handle || row.custom_answers?.discord_handle || row.custom_answers?.discordHandle || '',
            twitterUrl: row.twitter_url || row.custom_answers?.twitter_url || row.custom_answers?.twitterUrl || '',
            tshirtSize: row.tshirt_size || row.custom_answers?.tshirt_size || row.custom_answers?.tshirtSize || '',
            dietaryPreference: row.dietary_preference || row.custom_answers?.dietary_preference || row.custom_answers?.dietaryPreference || '',
            experienceLevel: row.experience_level || row.custom_answers?.experience_level || row.custom_answers?.experienceLevel || '',
            customAnswers: row.custom_answers || {},
            isTeam: Boolean(row.is_team),
            teamName: row.team_name || '',
            role: row.role || (row.is_team ? 'Team Leader' : 'Individual Hacker'),
            status: row.status || 'CONFIRMED',
            registeredAt: row.registered_at || new Date().toISOString(),
          });
        }
      });

      const formatted = Array.from(map.values());

      return NextResponse.json({
        success: true,
        eventId: targetEventId,
        count: formatted.length,
        registrations: formatted,
      });
    }

    // Query exact count of real rows in registrations table using service client (bypasses RLS)
    const { count, error } = await serverSupabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .in('event_id', idsToQuery);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const exactCount = count ?? 0;

    // Fetch existing event to preserve showcase / seeded baseline counts
    const { data: currentEvent } = await serverSupabase
      .from('events')
      .select('registration_count, participants_count')
      .eq('id', targetEventId)
      .maybeSingle();

    const baseline = Math.max(currentEvent?.participants_count ?? 0, currentEvent?.registration_count ?? 0);
    const finalCount = Math.max(baseline, exactCount);

    // Keep events.registration_count accurately synced in database
    await serverSupabase
      .from('events')
      .update({ registration_count: finalCount })
      .eq('id', targetEventId);

    return NextResponse.json({
      success: true,
      eventId: targetEventId,
      count: finalCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH: Update applicant status (single or bulk)
 */
export async function PATCH(req: Request) {
  try {
    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { action, id, ids, status } = body;

    if (action === 'update_status' && id && status) {
      const { error } = await serverSupabase
        .from('registrations')
        .update({ status })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'bulk_status' && Array.isArray(ids) && status) {
      const { error } = await serverSupabase
        .from('registrations')
        .update({ status })
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete participant registration (single, bulk, or clear all)
 */
export async function DELETE(req: Request) {
  try {
    const serverSupabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const eventIdParam = searchParams.get('eventId');

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Optional body
    }

    const action = body.action || (id ? 'delete_single' : null);
    const targetId = id || body.id;
    const targetIds = body.ids;
    const eventId = eventIdParam || body.eventId;

    if (action === 'delete_single' && targetId) {
      const { error } = await serverSupabase
        .from('registrations')
        .delete()
        .eq('id', targetId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (action === 'delete_bulk' && Array.isArray(targetIds) && targetIds.length > 0) {
      const { error } = await serverSupabase
        .from('registrations')
        .delete()
        .in('id', targetIds);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (action === 'clear_all' && eventId) {
      let resolvedId = eventId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (!isUuid) {
        const { data: ev } = await serverSupabase.from('events').select('id').eq('slug', eventId).maybeSingle();
        if (ev?.id) resolvedId = ev.id;
      }

      const { error } = await serverSupabase
        .from('registrations')
        .delete()
        .or(`event_id.eq.${resolvedId},event_id.eq.${eventId}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Sync count if eventId is provided
    if (eventId) {
      try {
        let resolvedId = eventId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
        if (!isUuid) {
          const { data: ev } = await serverSupabase.from('events').select('id').eq('slug', eventId).maybeSingle();
          if (ev?.id) resolvedId = ev.id;
        }
        const { count } = await serverSupabase
          .from('registrations')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', resolvedId);

        await serverSupabase
          .from('events')
          .update({ registration_count: count ?? 0 })
          .eq('id', resolvedId);
      } catch (countErr) {
        console.warn('Sync registration count on delete warning:', countErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}


