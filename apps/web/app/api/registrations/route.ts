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

    const detectedUtmCode = (
      input.utmCode ||
      input.utm_code ||
      input.ref ||
      input.customAnswers?.utm_code ||
      input.customAnswers?.utmCode ||
      input.customAnswers?.ref
    );

    const packedCustomAnswers: Record<string, any> = {
      ...(input.customAnswers || {}),
      ...(detectedUtmCode ? { utm_code: String(detectedUtmCode).trim().toLowerCase() } : {}),
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

    // ─── Attribute UTM Referral Conversion ──────────────────────────────
    if (detectedUtmCode) {
      const cleanCode = String(detectedUtmCode).trim().toLowerCase();
      try {
        const { data: utmLink } = await serverSupabase
          .from('event_utm_links')
          .select('id, confirmed_registrations_count')
          .eq('event_id', targetEventId)
          .eq('code', cleanCode)
          .maybeSingle();

        if (utmLink) {
          const newRegCount = Number(utmLink.confirmed_registrations_count || 0) + 1;
          await serverSupabase
            .from('event_utm_links')
            .update({
              confirmed_registrations_count: newRegCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', utmLink.id);

          try {
            await serverSupabase.from('event_utm_registrations').insert({
              utm_link_id: utmLink.id,
              event_id: targetEventId,
              user_id: validUserId || null,
              user_name: payload.user_name,
              user_email: userEmail,
              status: payload.status || 'CONFIRMED',
            });
          } catch {}
        }
      } catch (utmErr) {
        console.warn('[Registrations] UTM attribution warning:', utmErr);
      }
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
    const allCounts = searchParams.get('allCounts') === 'true' || searchParams.get('allCounts') === '1' || searchParams.get('counts') === 'all';

    const serverSupabase = createAdminClient();

    if (allCounts) {
      const { data: events } = await serverSupabase
        .from('events')
        .select('id, slug, registration_count, participants_count');

      const { data: regRows } = await serverSupabase
        .from('registrations')
        .select('event_id');

      const counts: Record<string, number> = {};
      const regCountByEvent: Record<string, number> = {};
      regRows?.forEach((r: any) => {
        if (r.event_id) {
          regCountByEvent[r.event_id] = (regCountByEvent[r.event_id] || 0) + 1;
        }
      });

      events?.forEach((e: any) => {
        const dbRowsCount = regCountByEvent[e.id] || 0;
        const baseline = Math.max(
          typeof e.registration_count === 'number' ? e.registration_count : 0,
          typeof e.participants_count === 'number' ? e.participants_count : 0,
          dbRowsCount
        );
        if (e.id) counts[e.id] = baseline;
        if (e.slug) counts[e.slug] = baseline;
      });

      return NextResponse.json({ success: true, counts });
    }

    const userId = searchParams.get('userId');
    if (userId) {
      const { data: userRegs } = await serverSupabase
        .from('registrations')
        .select('*, events(*)')
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

      return NextResponse.json({ success: true, registrations: userRegs || [] });
    }

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

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
        return NextResponse.json({ error: regError.message, registrations: [], teams: [] }, { status: 500 });
      }

      // Fetch teams and payments for these events to cross-reference payment status
      const { data: teamRows } = await serverSupabase
        .from('teams')
        .select('id, name, event_id, leader_id, payment_status, payment_id')
        .in('event_id', idsToQuery);

      const allTeamIds = (teamRows || []).map((t: any) => t.id).filter(Boolean);
      const [{ data: payRows }, { data: memberRows }] = await Promise.all([
        serverSupabase
          .from('payments')
          .select('*')
          .in('event_id', idsToQuery),
        allTeamIds.length > 0
          ? serverSupabase
              .from('team_members')
              .select('team_id, user_id, role, status')
              .in('team_id', allTeamIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Build indexing maps for quick lookup of payments
      const paidPayments = (payRows || []).filter((p: any) => p.status === 'PAID');
      const payById = new Map<string, any>();
      const payByTeamId = new Map<string, any>();
      const payByTeamName = new Map<string, any>();
      const payByLeaderEmail = new Map<string, any>();
      const payByUserId = new Map<string, any>();

      paidPayments.forEach((p: any) => {
        if (p.id) payById.set(p.id, p);
        if (p.team_id) payByTeamId.set(p.team_id, p);
        if (p.team_name) payByTeamName.set(p.team_name.toLowerCase().trim(), p);
        if (p.team_leader_email) payByLeaderEmail.set(p.team_leader_email.toLowerCase().trim(), p);
        if (p.user_id) payByUserId.set(p.user_id, p);
      });

      const teamByName = new Map<string, any>();
      const teamById = new Map<string, any>();
      (teamRows || []).forEach((t: any) => {
        if (t.id) teamById.set(t.id, t);
        if (t.name) {
          const tClean = t.name.toLowerCase().trim();
          const existing = teamByName.get(tClean);
          // If duplicate exists, prefer the one with PAID status or payment_id
          if (!existing || (!existing.payment_status && t.payment_status === 'PAID') || (!existing.payment_id && t.payment_id)) {
            teamByName.set(tClean, t);
          }
        }
      });

      const teamIdByUserId = new Map<string, string>();
      (memberRows || []).forEach((m: any) => {
        if (m.user_id && m.team_id) {
          teamIdByUserId.set(m.user_id, m.team_id);
        }
      });

      const map = new Map<string, any>();
      const teamAggMap = new Map<string, any>();

      (regRows || []).forEach((row: any) => {
        const key = (row.user_email || row.id || '').toLowerCase().trim();
        const teamNameClean = (row.team_name || '').toLowerCase().trim();
        const userEmailClean = (row.user_email || '').toLowerCase().trim();
        const userId = row.user_id;
        const memberTeamId = row.team_id || (userId ? teamIdByUserId.get(userId) : null);
        const teamId = memberTeamId;
        const paymentId = row.payment_id;

        // Find matching payment record
        let matchedPayment: any = null;
        if (paymentId && payById.has(paymentId)) {
          matchedPayment = payById.get(paymentId);
        } else if (teamId && payByTeamId.has(teamId)) {
          matchedPayment = payByTeamId.get(teamId);
        } else if (teamNameClean && payByTeamName.has(teamNameClean)) {
          matchedPayment = payByTeamName.get(teamNameClean);
        } else if (userEmailClean && payByLeaderEmail.has(userEmailClean)) {
          matchedPayment = payByLeaderEmail.get(userEmailClean);
        } else if (userId && payByUserId.has(userId)) {
          matchedPayment = payByUserId.get(userId);
        }

        const matchedTeam = (teamId ? teamById.get(teamId) : null) || (teamNameClean ? teamByName.get(teamNameClean) : null);
        if (!matchedPayment && matchedTeam?.payment_status === 'PAID' && matchedTeam.payment_id && payById.has(matchedTeam.payment_id)) {
          matchedPayment = payById.get(matchedTeam.payment_id);
        }

        const isPaid = Boolean(
          matchedPayment ||
          row.payment_status === 'PAID' ||
          matchedTeam?.payment_status === 'PAID'
        );

        const utr =
          matchedPayment?.utr_number ||
          matchedPayment?.raw_response?.acquirer_data?.rrn ||
          matchedPayment?.raw_response?.acquirer_data?.upi_transaction_id ||
          matchedPayment?.raw_response?.acquirer_data?.bank_transaction_id ||
          (isPaid ? matchedPayment?.razorpay_payment_id : null) ||
          (isPaid ? 'CONFIRMED' : null);

        const transactionDate = matchedPayment?.transaction_date || matchedPayment?.created_at || (isPaid ? row.registered_at : null);
        const paymentIdVal = matchedPayment?.razorpay_payment_id || matchedPayment?.id || row.payment_id || (isPaid ? 'CONFIRMED' : null);
        const amountVal = matchedPayment?.amount
          ? `₹${matchedPayment.amount}`
          : matchedPayment?.amount_in_paise
          ? `₹${matchedPayment.amount_in_paise / 100}`
          : (isPaid ? '₹800' : null);
        const proofLink = matchedPayment?.razorpay_payment_id
          ? `https://dashboard.razorpay.com/app/payments/${matchedPayment.razorpay_payment_id}`
          : utr && utr !== 'CONFIRMED'
          ? `UTR Ref: ${utr}`
          : null;

        // Auto-heal registration record in database asynchronously if out of sync
        if (isPaid && row.payment_status !== 'PAID') {
          Promise.resolve(
            serverSupabase
              .from('registrations')
              .update({ payment_status: 'PAID', payment_id: paymentIdVal || undefined })
              .eq('id', row.id)
          ).catch(() => {});
        }

        const regItem = {
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
          teamId: row.team_id || memberTeamId || matchedTeam?.id || null,
          role: row.role || (row.is_team ? 'Team Leader' : 'Individual Hacker'),
          status: row.status || 'CONFIRMED',
          registeredAt: row.registered_at || new Date().toISOString(),
          paymentStatus: isPaid ? 'PAID' : (row.payment_status || 'UNPAID'),
          paymentConfirmed: isPaid,
          transactionConfirmed: isPaid ? 'Yes' : 'No',
          transactionDate: transactionDate,
          utrNumber: utr,
          paymentId: paymentIdVal,
          paymentAmount: amountVal,
          paymentMethod: (matchedPayment?.payment_method || (isPaid ? 'UPI' : null))?.toUpperCase(),
          paymentProofLink: proofLink,
        };

        if (key && !map.has(key)) {
          map.set(key, regItem);
        }

        // Group into teams: group squads with the same name together so duplicates never fracture members
        const resolvedTeamId = row.team_id || memberTeamId || matchedTeam?.id;
        const groupTeamName = row.team_name?.trim() || matchedTeam?.name || 'Solo Builders';
        const groupKey = groupTeamName.toLowerCase() === 'solo builders'
          ? `solo_${row.id || row.user_email}`
          : `name_${groupTeamName.toLowerCase()}`;

        if (!teamAggMap.has(groupKey)) {
          teamAggMap.set(groupKey, {
            id: resolvedTeamId || groupKey,
            teamId: resolvedTeamId || null,
            teamName: groupTeamName,
            isPaid: isPaid,
            paymentStatus: isPaid ? 'PAID' : 'UNPAID',
            transactionConfirmed: isPaid ? 'Yes' : 'No',
            transactionDate: transactionDate,
            utrNumber: utr,
            paymentId: paymentIdVal,
            paymentAmount: amountVal,
            paymentProofLink: proofLink,
            paymentMethod: (matchedPayment?.payment_method || (isPaid ? 'UPI' : null))?.toUpperCase(),
            leaderName: row.user_name || 'Hacker',
            leaderEmail: row.user_email || '',
            leaderPhone: row.phone || '',
            membersCount: 0,
            approvedCount: 0,
            members: [],
          });
        }

        const teamEntry = teamAggMap.get(groupKey);
        if (row.status === 'APPROVED' || row.status === 'CONFIRMED') {
          teamEntry.approvedCount += 1;
        }
        if (isPaid && !teamEntry.isPaid) {
          teamEntry.isPaid = true;
          teamEntry.paymentStatus = 'PAID';
          teamEntry.transactionConfirmed = 'Yes';
          teamEntry.transactionDate = teamEntry.transactionDate || transactionDate;
          teamEntry.utrNumber = teamEntry.utrNumber || utr;
          teamEntry.paymentId = teamEntry.paymentId || paymentIdVal;
          teamEntry.paymentAmount = teamEntry.paymentAmount || amountVal;
          teamEntry.paymentProofLink = teamEntry.paymentProofLink || proofLink;
        }

        const isTrueLeader = (matchedTeam?.leader_id && row.user_id === matchedTeam.leader_id) ||
                             row.role?.toLowerCase().includes('lead');
        if (isTrueLeader || !teamEntry.leaderEmail) {
          teamEntry.leaderName = row.user_name;
          teamEntry.leaderEmail = row.user_email;
          teamEntry.leaderPhone = row.phone || teamEntry.leaderPhone;
        }
        if (!teamEntry.members.some((m: any) => m.id === regItem.id || (m.userEmail && m.userEmail.toLowerCase() === regItem.userEmail.toLowerCase()))) {
          teamEntry.members.push(regItem);
        }
        teamEntry.membersCount = teamEntry.members.length;
      });

      // Also ensure any teams from `teamRows` that had no registrations are included
      (teamRows || []).forEach((t: any) => {
        const tCleanName = t.name?.toLowerCase().trim();
        const tKey = tCleanName ? `name_${tCleanName}` : `team_${t.id}`;
        if (!teamAggMap.has(tKey)) {
          const tPaid = t.payment_status === 'PAID' || payByTeamId.has(t.id) || (tCleanName && payByTeamName.has(tCleanName));
          const pay = (t.payment_id ? payById.get(t.payment_id) : null) || payByTeamId.get(t.id) || (tCleanName ? payByTeamName.get(tCleanName) : null);
          teamAggMap.set(tKey, {
            id: t.id,
            teamId: t.id,
            teamName: t.name,
            isPaid: tPaid,
            paymentStatus: tPaid ? 'PAID' : 'UNPAID',
            transactionConfirmed: tPaid ? 'Yes' : 'No',
            transactionDate: pay?.transaction_date || pay?.created_at || null,
            utrNumber: pay?.utr_number || (tPaid ? 'CONFIRMED' : null),
            paymentId: pay?.razorpay_payment_id || t.payment_id || null,
            paymentAmount: pay?.amount ? `₹${pay.amount}` : (tPaid ? '₹800' : null),
            paymentProofLink: pay?.razorpay_payment_id ? `https://dashboard.razorpay.com/app/payments/${pay.razorpay_payment_id}` : null,
            paymentMethod: pay?.payment_method?.toUpperCase() || (tPaid ? 'UPI' : null),
            leaderName: '',
            leaderEmail: '',
            leaderPhone: '',
            membersCount: 0,
            approvedCount: 0,
            members: [],
          });
        } else {
          // If team already exists in teamAggMap, merge payment info from this team row
          const existing = teamAggMap.get(tKey);
          if (!existing.isPaid && (t.payment_status === 'PAID' || payByTeamId.has(t.id))) {
            const pay = (t.payment_id ? payById.get(t.payment_id) : null) || payByTeamId.get(t.id);
            existing.isPaid = true;
            existing.paymentStatus = 'PAID';
            existing.transactionConfirmed = 'Yes';
            existing.utrNumber = pay?.utr_number || 'CONFIRMED';
            existing.paymentId = pay?.razorpay_payment_id || t.payment_id || null;
            existing.paymentAmount = pay?.amount ? `₹${pay.amount}` : '₹800';
            existing.paymentProofLink = pay?.razorpay_payment_id ? `https://dashboard.razorpay.com/app/payments/${pay.razorpay_payment_id}` : null;
          }
        }
      });

      const formattedRegistrations = Array.from(map.values());
      const formattedTeams = Array.from(teamAggMap.values())
        .filter((team: any) => {
          // Discard empty orphan duplicate if another team with this name has members
          if (team.membersCount === 0) {
            const norm = (team.teamName || '').toLowerCase().trim();
            const hasPopulated = Array.from(teamAggMap.values()).some((other: any) =>
              other !== team &&
              (other.teamName || '').toLowerCase().trim() === norm &&
              other.membersCount > 0
            );
            if (hasPopulated) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (a.isPaid !== b.isPaid) return a.isPaid ? -1 : 1;
          return b.membersCount - a.membersCount;
        });

      return NextResponse.json({
        success: true,
        eventId: targetEventId,
        count: formattedRegistrations.length,
        registrations: formattedRegistrations,
        teams: formattedTeams,
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
 * PATCH: Update applicant status (single, bulk, or payment status)
 */
export async function PATCH(req: Request) {
  try {
    const serverSupabase = createAdminClient();
    const body = await req.json();
    const { action, id, ids, status, teamName, paymentStatus, utrNumber } = body;

    if (action === 'update_payment_status') {
      const targetStatus = paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';

      if (id) {
        await serverSupabase
          .from('registrations')
          .update({ payment_status: targetStatus })
          .eq('id', id);
      }

      if (teamName) {
        await serverSupabase
          .from('registrations')
          .update({ payment_status: targetStatus })
          .ilike('team_name', teamName.trim());

        await serverSupabase
          .from('teams')
          .update({ payment_status: targetStatus })
          .ilike('name', teamName.trim());
      }

      return NextResponse.json({ success: true, paymentStatus: targetStatus });
    }

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


